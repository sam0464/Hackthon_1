// ============================================================
// Bajaj Finance AI Assistant — Core Application Logic
// ============================================================
// IMPORTANT: Replace YOUR_GEMINI_API_KEY with your actual key
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ── State ──
let customerData = {};      // { mobileNo: [{...loan rows}] }
let currentCustomer = null; // current logged in customer
let currentLoans = [];      // loans for current customer
let conversationHistory = []; // Gemini chat history
let mfEligibility = null;  // MF eligibility result
let mfRecommendations = []; // recommended funds
let pitchMade = false;      // whether MF pitch has been triggered
let questionCount = 0;      // count of questions asked
let debugStats = {          // observability metrics
  totalTokensIn: 0,
  totalTokensOut: 0,
  lastLatency: 0,
  requestCount: 0,
  lastModel: GEMINI_MODEL
};

// ── CSV Loader ──
async function loadCSV() {
  try {
    const response = await fetch('Customer_Data_.csv');
    const text = await response.text();
    parseCSV(text);
    console.log(`✅ Loaded ${Object.keys(customerData).length} unique customers`);
    return true;
  } catch (e) {
    console.error('CSV load failed:', e);
    return false;
  }
}

function parseCSV(text) {
  const rows = text.trim().split('\n');
  const headers = rows[0].split(',').map(h => h.trim().replace(/\r/g, ''));
  customerData = {};

  for (let i = 1; i < rows.length; i++) {
    const cols = smartSplit(rows[i]);
    if (cols.length < headers.length) continue;
    const obj = {};
    headers.forEach((h, idx) => obj[h] = (cols[idx] || '').trim().replace(/\r/g, ''));
    const mobile = obj['MobileNo'];
    if (!mobile) continue;
    if (!customerData[mobile]) customerData[mobile] = [];
    customerData[mobile].push(obj);
  }
}

function smartSplit(row) {
  // Handle commas in strings
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const ch of row) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

// ── Login ──
async function handleLogin(mobile) {
  const loans = customerData[mobile];
  if (!loans || loans.length === 0) return false;

  currentCustomer = loans[0]; // first record for name/demographics
  currentLoans = loans;

  // Compute MF eligibility
  mfEligibility = getMFEligibilityScore(currentLoans);
  mfRecommendations = recommendFunds(currentLoans, mfEligibility);

  return true;
}

// ── Computed Loan Fields ──
function computeLoanDetails(loan) {
  const disbDate = parseDMY(loan.Disbursement_date);
  const today = new Date();
  const monthsElapsed = disbDate
    ? Math.floor((today - disbDate) / (1000 * 60 * 60 * 24 * 30.44))
    : 0;
  const tenure = parseInt(loan.Tenure) || 0;
  const remainingMonths = Math.max(0, tenure - monthsElapsed);
  const emi = parseFloat(loan.EMI_amount) || 0;
  const outstandingPrincipal = parseFloat(loan.Principal_amount) || 0;
  const totalPaid = Math.min(monthsElapsed, tenure) * emi;
  const interestRate = parseFloat(loan.Interest) || 0;

  return {
    ...loan,
    monthsElapsed,
    remainingMonths,
    totalPaid,
    outstandingPrincipal,
    interestRate,
    disbDate,
    formattedDisbDate: disbDate ? disbDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : loan.Disbursement_date,
    isActive: loan.Loan_status === 'Active',
    maturityDate: disbDate ? new Date(disbDate.getTime() + tenure * 30.44 * 24 * 60 * 60 * 1000) : null
  };
}

function parseDMY(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  return new Date(`${parts[2]}-${String(parts[1]).padStart(2,'0')}-${String(parts[0]).padStart(2,'0')}`);
}

function formatINR(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return '₹0';
  if (num >= 10000000) return `₹${(num/10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num/100000).toFixed(2)} L`;
  if (num >= 1000) return `₹${(num/1000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
}

// ── System Prompt Builder ──
function buildSystemPrompt() {
  const loanDetails = currentLoans.map(loan => {
    const c = computeLoanDetails(loan);
    return `
  - LAN: ${c.LAN} | Type: ${c.Loan_type} | Status: ${c.Loan_status}
    Amount: ${formatINR(c.Loan_amount)} | Interest: ${(c.interestRate * 100).toFixed(2)}% p.a.
    EMI: ${formatINR(c.EMI_amount)}/month | Tenure: ${c.Tenure} months
    Disbursed: ${c.formattedDisbDate} | Elapsed: ${c.monthsElapsed} months
    Remaining Tenure: ${c.remainingMonths} months | Outstanding: ${formatINR(c.outstandingPrincipal)}
    DPD 30: ${c.DPD_30 || 'None'} | DPD 90: ${c.DPD_90 || 'None'}`;
  }).join('\n');

  const fundSummary = Object.values(BAJAJ_FUNDS).map(f =>
    `  - ${f.name} (${f.category}): ${f.objective.slice(0, 100)}... Risk: ${f.riskLevel}, AUM: ${f.aum}, Expense: ${f.expenseRatio.direct} (Direct)`
  ).join('\n');

  const topFundDetails = Object.values(BAJAJ_FUNDS).slice(0, 5).map(f => `
  === ${f.name} ===
  Category: ${f.category} | Risk: ${f.riskLevel}
  AUM: ${f.aum} | Benchmark: ${f.benchmark}
  NAV (Direct Growth): ₹${f.nav.directGrowth}
  Expense Ratio: Regular ${f.expenseRatio.regular}, Direct ${f.expenseRatio.direct}
  Exit Load: ${f.exitLoad}
  Min Investment: ${f.minInvestment}
  Inception: ${f.inceptionDate}
  Top Sectors: ${(f.topSectors || []).slice(0, 3).join(', ')}
  Key Features: ${(f.keyFeatures || []).slice(0, 3).join('; ')}
  Suitable For: ${(f.suitableFor || []).join(', ')}
  `).join('\n');

  const eligibilityCtx = mfEligibility ? `
MF CROSS-SELL ELIGIBILITY:
  Score: ${mfEligibility.score}/11 | Tier: ${mfEligibility.tier} | Eligible: ${mfEligibility.eligible}
  Qualifying reasons: ${mfEligibility.reasons.join(', ')}
  Recommended funds (in order): ${mfRecommendations.map(r => r.fund.name).join(', ')}
  ` : '';

  return `You are ARIA — an intelligent AI Banking Assistant for Bajaj Finance Limited. You serve existing loan customers.

TODAY'S DATE: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

CUSTOMER PROFILE:
  Name: ${currentCustomer.Name}
  Mobile: ${currentCustomer.MobileNo}
  Age: ${currentCustomer.Age} | Gender: ${currentCustomer.Gender}
  Employment: ${currentCustomer.Employment_type}
  Estimated Monthly Income: ${formatINR(currentCustomer.Imputed_Income)}
  App Credit Score: ${currentCustomer.App_score}/10
  Pincode: ${currentCustomer.PIncode}

LOAN ACCOUNTS:
${loanDetails}

${eligibilityCtx}

BAJAJ AMC MUTUAL FUND FACTSHEET (July 2026 — Source of Truth):
Available Funds:
${fundSummary}

Detailed Fund Data:
${topFundDetails}

BEHAVIORAL RULES:
1. LOAN QUERIES: Always reference the exact loan data provided. Compute remaining months, outstanding balances, EMI details accurately. If multiple loans exist, clarify which one you're referring to.
2. FUND PITCH TIMING: After ${pitchMade ? 'already pitched' : 'answering 2+ loan questions, naturally introduce mutual funds'}. Only pitch if customer is ${mfEligibility?.eligible ? 'ELIGIBLE (do pitch!)' : 'not eligible (skip pitch)'}.
3. FUND INFORMATION: Answer ALL mutual fund questions using ONLY the factsheet data provided. Never hallucinate fund performance.
4. TONE: Be warm, conversational, professional. Use Indian financial context (₹, lakhs, crores). Address customer by first name.
5. CROSS-SELL APPROACH: Frame mutual funds as wealth-building opportunities complementary to their loan, not as a sales pitch. Be natural, not pushy.
6. DISCLAIMER: When discussing mutual fund returns or recommendations, always add: "Mutual fund investments are subject to market risks. Please read all scheme related documents carefully."
7. FORMATTING: Use markdown for structure. Keep responses concise but complete. Use bullet points for lists.

IMPORTANT: You have access to exact loan data. Do NOT say you cannot access account information — you CAN and SHOULD use the data provided above.`;
}

// ── Gemini API ──
async function callGemini(userMessage) {
  const startTime = performance.now();

  // Add to history
  conversationHistory.push({ role: "user", parts: [{ text: userMessage }] });

  const payload = {
    system_instruction: { parts: [{ text: buildSystemPrompt() }] },
    contents: conversationHistory,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  };

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `API Error ${response.status}`);
  }

  const data = await response.json();
  const latency = Math.round(performance.now() - startTime);

  // Extract text
  const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response. Please try again.";

  // Update history
  conversationHistory.push({ role: "model", parts: [{ text: assistantText }] });

  // Debug stats
  const usage = data.usageMetadata || {};
  debugStats.totalTokensIn += usage.promptTokenCount || 0;
  debugStats.totalTokensOut += usage.candidatesTokenCount || 0;
  debugStats.lastLatency = latency;
  debugStats.requestCount++;
  debugStats.lastModel = data.modelVersion || GEMINI_MODEL;

  updateDebugHUD({
    promptTokens: usage.promptTokenCount || 0,
    completionTokens: usage.candidatesTokenCount || 0,
    latency,
    model: debugStats.lastModel
  });

  return assistantText;
}

// ── Chat UI ──
function addMessage(role, content, isWelcome = false) {
  const container = document.getElementById('messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${role}`;

  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const avatarEmoji = role === 'user' ? '👤' : '🤖';

  msgDiv.innerHTML = `
    <div class="msg-avatar">${avatarEmoji}</div>
    <div>
      <div class="msg-bubble">${formatMessageContent(content)}</div>
      <div class="msg-time">${now}</div>
    </div>
  `;

  container.appendChild(msgDiv);
  scrollToBottom();
  return msgDiv;
}

function formatMessageContent(text) {
  // Convert markdown-ish to HTML
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>')
    .replace(/## (.*?)(\n|$)/g, '<h3>$1</h3>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '• ')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function showTyping() {
  const container = document.getElementById('messages');
  const el = document.createElement('div');
  el.id = 'typing-indicator';
  el.className = 'typing-indicator message assistant';
  el.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="typing-dots">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  container.appendChild(el);
  scrollToBottom();
}

function hideTyping() {
  document.getElementById('typing-indicator')?.remove();
}

function scrollToBottom() {
  const c = document.getElementById('messages');
  c.scrollTop = c.scrollHeight;
}

// ── Send Message ──
async function sendMessage(text) {
  if (!text.trim() || !currentCustomer) return;
  if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
    showApiKeyWarning();
    return;
  }

  questionCount++;
  const inputEl = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');

  // Add user message
  addMessage('user', escapeHtml(text));
  inputEl.value = '';
  inputEl.style.height = 'auto';
  sendBtn.disabled = true;

  // Show typing
  showTyping();

  try {
    const reply = await callGemini(text);
    hideTyping();

    // Check if MF pitch should be triggered
    const shouldPitch = !pitchMade && mfEligibility?.eligible && questionCount >= 2;
    const looksLikeMFTopic = /mutual fund|invest|wealth|saving|return|grow/i.test(text);

    if (shouldPitch && !looksLikeMFTopic) {
      // Add main reply first
      addMessage('assistant', reply);
      // Then naturally add pitch after a short delay
      setTimeout(() => {
        triggerMFPitch();
        pitchMade = true;
      }, 800);
    } else {
      if (shouldPitch) pitchMade = true;
      addMessage('assistant', reply);
      injectFundCardsIfMentioned(reply);
    }

  } catch (err) {
    hideTyping();
    addMessage('assistant', `❌ **Error:** ${err.message}\n\nPlease check your API key and try again.`);
    console.error('Gemini error:', err);
  }

  sendBtn.disabled = false;
}

function escapeHtml(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showApiKeyWarning() {
  addMessage('assistant', `⚠️ **API Key Required**\n\nTo use this assistant, please open \`app.js\` and replace \`YOUR_GEMINI_API_KEY\` with your actual Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).\n\nOnce done, refresh the page.`);
}

// ── MF Pitch ──
function triggerMFPitch() {
  const rec = mfRecommendations[0];
  if (!rec) return;

  const tier = mfEligibility.tier;
  const tierEmoji = { Platinum: '💎', Gold: '🥇', Silver: '🥈', Standard: '📊' }[tier] || '📊';

  const pitchText = `
${tierEmoji} **${currentCustomer.Name.split(' ')[0]}, a quick thought while we're talking…**

Based on your excellent financial profile — clean repayment history, strong credit score, and consistent income — you qualify for our **${tier} Tier** wealth program.

Many Bajaj Finance customers like you are building wealth alongside their loan repayments. Since you're already disciplined with your EMIs, that same discipline can compound beautifully in mutual funds.

I'd especially recommend looking at the **${rec.fund.name}** for you. ${rec.reason}.

Would you like to know more about this fund, or shall I suggest a SIP amount that fits alongside your current EMI?

*Mutual fund investments are subject to market risks. Please read all scheme related documents carefully.*`;

  const msgEl = addMessage('assistant', pitchText);

  // Append fund card to the message
  const fundCard = createFundCard(rec.fund, rec.reason);
  msgEl.querySelector('.msg-bubble').appendChild(fundCard);

  // Speak the pitch (shorter version)
  speak(`${currentCustomer.Name.split(' ')[0]}, based on your excellent profile, I'd like to share a mutual fund opportunity that could help you build wealth alongside your existing loans. Would you like to know more?`);
}

function createFundCard(fund, reason) {
  const div = document.createElement('div');
  div.className = 'fund-pitch-card';
  div.innerHTML = `
    <div class="fund-pitch-header">
      <span style="font-size:1.4rem">${fund.emoji}</span>
      <div>
        <div class="fund-pitch-name">${fund.name}</div>
        <span class="fund-pitch-cat">${fund.category}</span>
      </div>
    </div>
    <div class="fund-pitch-reason">"${reason}"</div>
    <div class="fund-pitch-stats">
      <div class="fund-stat">
        <div class="fund-stat-val">${fund.aum}</div>
        <div class="fund-stat-lbl">AUM</div>
      </div>
      <div class="fund-stat">
        <div class="fund-stat-val">${fund.expenseRatio.direct}</div>
        <div class="fund-stat-lbl">Direct Expense</div>
      </div>
      <div class="fund-stat">
        <div class="fund-stat-val">${fund.riskLevel}</div>
        <div class="fund-stat-lbl">Risk</div>
      </div>
      <div class="fund-stat">
        <div class="fund-stat-val">${fund.minInvestment}</div>
        <div class="fund-stat-lbl">Min. SIP</div>
      </div>
    </div>
    <button class="fund-learn-btn" onclick="askAboutFund('${fund.id}')">Learn More →</button>
  `;
  return div;
}

function askAboutFund(fundId) {
  const fund = BAJAJ_FUNDS[fundId];
  if (!fund) return;
  const input = document.getElementById('user-input');
  input.value = `Tell me more about the ${fund.name} — what are its key features and is it suitable for me?`;
  input.focus();
}

function injectFundCardsIfMentioned(reply) {
  // If reply mentions specific funds, add compact fund info
  const mentionedFunds = Object.values(BAJAJ_FUNDS).filter(f =>
    reply.toLowerCase().includes(f.shortName.toLowerCase()) ||
    reply.toLowerCase().includes(f.name.toLowerCase().split(' ').slice(2).join(' '))
  );
  // Fund cards are shown inline in the message already via markdown
}

// ── Voice Integration ──
let recognition = null;
let synthesis = window.speechSynthesis;
let currentUtterance = null;
let isSpeaking = false;
let isListening = false;

function initVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported');
    document.getElementById('voice-btn').disabled = true;
    document.getElementById('voice-btn').title = 'Voice not supported in this browser';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-IN';

  recognition.onstart = () => {
    isListening = true;
    updateVoiceUI('listening');
  };

  recognition.onresult = (e) => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    const input = document.getElementById('user-input');
    input.value = transcript;
    if (e.results[e.results.length - 1].isFinal) {
      isListening = false;
      updateVoiceUI('idle');
      if (transcript.trim()) {
        setTimeout(() => sendMessage(transcript), 300);
      }
    }
  };

  recognition.onerror = (e) => {
    console.error('Voice error:', e.error);
    isListening = false;
    updateVoiceUI('idle');
  };

  recognition.onend = () => {
    if (isListening) { isListening = false; updateVoiceUI('idle'); }
  };
}

function toggleListening() {
  if (!recognition) { alert('Voice recognition not available in this browser. Try Chrome or Edge.'); return; }
  if (isListening) {
    recognition.stop();
    isListening = false;
    updateVoiceUI('idle');
  } else {
    stopSpeaking();
    recognition.start();
  }
}

function speak(text) {
  if (!synthesis) return;
  stopSpeaking();

  // Clean text for speech
  const clean = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/[#]/g, '').replace(/\n/g, '. ').replace(/₹/g, 'rupees ').replace(/[→←]/g, '');

  currentUtterance = new SpeechSynthesisUtterance(clean);
  currentUtterance.lang = 'en-IN';
  currentUtterance.rate = 0.95;
  currentUtterance.pitch = 1.05;
  currentUtterance.volume = 0.9;

  // Prefer Indian voice if available
  const voices = synthesis.getVoices();
  const indianVoice = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en'));
  if (indianVoice) currentUtterance.voice = indianVoice;

  currentUtterance.onstart = () => { isSpeaking = true; updateVoiceUI('speaking'); };
  currentUtterance.onend = () => { isSpeaking = false; updateVoiceUI('idle'); };
  currentUtterance.onerror = () => { isSpeaking = false; updateVoiceUI('idle'); };

  synthesis.speak(currentUtterance);
}

function stopSpeaking() {
  if (synthesis && synthesis.speaking) {
    synthesis.cancel();
    isSpeaking = false;
    updateVoiceUI('idle');
  }
}

function updateVoiceUI(state) {
  const btn = document.getElementById('voice-btn');
  const status = document.getElementById('voice-status');

  btn.classList.remove('listening', 'speaking');
  status.classList.remove('show', 'speaking');

  if (state === 'listening') {
    btn.classList.add('listening');
    btn.innerHTML = '🔴';
    status.classList.add('show');
    status.innerHTML = `<div class="voice-wave">${'<div class="voice-bar"></div>'.repeat(5)}</div> Listening...`;
  } else if (state === 'speaking') {
    btn.classList.add('speaking');
    btn.innerHTML = '🔊';
    status.classList.add('show', 'speaking');
    status.innerHTML = `<div class="voice-wave">${'<div class="voice-bar"></div>'.repeat(5)}</div> Speaking...`;
  } else {
    btn.innerHTML = '🎤';
  }
}

// ── Debug HUD ──
let hudCollapsed = true;

function updateDebugHUD({ promptTokens, completionTokens, latency, model }) {
  // Update values
  document.getElementById('dbg-prompt-tokens').textContent = promptTokens.toLocaleString();
  document.getElementById('dbg-completion-tokens').textContent = completionTokens.toLocaleString();
  document.getElementById('dbg-total-tokens').textContent = (debugStats.totalTokensIn).toLocaleString();
  document.getElementById('dbg-latency').textContent = `${latency}ms`;
  document.getElementById('dbg-requests').textContent = debugStats.requestCount;
  document.getElementById('dbg-model').textContent = model;
  document.getElementById('dbg-mf-score').textContent = mfEligibility ? `${mfEligibility.score} (${mfEligibility.tier})` : 'N/A';
  document.getElementById('dbg-turns').textContent = questionCount;

  // Latency coloring
  const latEl = document.getElementById('dbg-latency');
  latEl.className = 'debug-metric-value ' + (latency < 2000 ? 'green' : latency < 4000 ? 'gold' : 'red');

  // Auto-expand HUD after first request
  if (debugStats.requestCount === 1 && hudCollapsed) {
    toggleDebugHUD();
  }
}

function toggleDebugHUD() {
  hudCollapsed = !hudCollapsed;
  const panel = document.getElementById('debug-panel');
  const arrow = document.getElementById('hud-arrow');
  panel.classList.toggle('collapsed', hudCollapsed);
  arrow.textContent = hudCollapsed ? '▲' : '▼';
}

// ── Sidebar Rendering ──
function renderSidebar() {
  // Render loan accounts
  const accountsList = document.getElementById('accounts-list');
  accountsList.innerHTML = '';

  const uniqueLoans = [...new Set(currentLoans.map(l => l.LAN))].map(lan => currentLoans.find(l => l.LAN === lan));

  uniqueLoans.forEach((loan, idx) => {
    const c = computeLoanDetails(loan);
    const div = document.createElement('div');
    div.className = `account-card${idx === 0 ? ' active' : ''}`;
    div.innerHTML = `
      <div class="account-type">${c.Loan_type}</div>
      <div class="account-lan">${c.LAN}</div>
      <div class="account-amount">${formatINR(c.Loan_amount)}</div>
      <div>
        <span class="account-status ${c.Loan_status.toLowerCase()}">
          <span class="status-dot ${c.Loan_status.toLowerCase()}"></span>
          ${c.Loan_status}
        </span>
      </div>
    `;
    div.onclick = () => {
      document.querySelectorAll('.account-card').forEach(el => el.classList.remove('active'));
      div.classList.add('active');
      const q = `Tell me about my ${c.Loan_type} account (${c.LAN}) — current balance, EMI and remaining tenure`;
      document.getElementById('user-input').value = q;
    };
    accountsList.appendChild(div);
  });

  // Render MF eligibility
  if (mfEligibility) {
    const badge = document.getElementById('eligibility-badge');
    const tierColors = { Platinum: '#A855F7', Gold: '#FFB800', Silver: '#8892B0', Standard: '#4F78FF' };
    const tierEmojis = { Platinum: '💎', Gold: '🥇', Silver: '🥈', Standard: '📊' };
    const color = tierColors[mfEligibility.tier] || '#4F78FF';
    badge.innerHTML = `
      <div class="eligibility-tier" style="color:${color}">${tierEmojis[mfEligibility.tier] || '📊'} ${mfEligibility.tier} Tier</div>
      <div class="eligibility-score">${mfEligibility.score} <span>/ 11 pts</span></div>
      <div class="eligibility-reasons">${mfEligibility.reasons.slice(0, 2).map(r => `✓ ${r}`).join('<br>')}</div>
    `;
  }

  // Update user info in topbar
  document.getElementById('user-name-display').textContent = currentCustomer.Name.split(' ')[0];
  document.getElementById('user-avatar-text').textContent = currentCustomer.Name.substring(0, 2).toUpperCase();
}

// ── Welcome Message ──
function showWelcomeMessage() {
  const activeLoans = currentLoans.filter(l => l.Loan_status === 'Active');
  const closedLoans = currentLoans.filter(l => l.Loan_status === 'Closed');
  const firstName = currentCustomer.Name.split(' ')[0];

  const container = document.getElementById('messages');
  container.innerHTML = '';

  const msgDiv = document.createElement('div');
  msgDiv.className = 'message assistant';

  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  msgDiv.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div>
      <div class="msg-bubble">
        <div class="welcome-card">
          <div class="welcome-greeting">👋 Hello, <span class="welcome-name">${firstName}!</span></div>
          <div class="welcome-text">
            I'm <strong>ARIA</strong>, your personal Bajaj Finance assistant. I have access to all your account details and I'm here to help.<br><br>
            You have <strong>${activeLoans.length} active</strong> and <strong>${closedLoans.length} closed</strong> loan account${currentLoans.length > 1 ? 's' : ''} with us. What would you like to know?
          </div>
          <div class="welcome-chips">
            <span class="welcome-chip" onclick="sendMessage('What is my current EMI and outstanding balance?')">💰 EMI & Balance</span>
            <span class="welcome-chip" onclick="sendMessage('How many months are remaining on my active loan?')">📅 Remaining Tenure</span>
            <span class="welcome-chip" onclick="sendMessage('Show me my repayment status')">✅ Repayment Status</span>
            <span class="welcome-chip" onclick="sendMessage('Tell me about my loan interest rate')">📊 Interest Rate</span>
          </div>
        </div>
      </div>
      <div class="msg-time">${now}</div>
    </div>
  `;

  container.appendChild(msgDiv);

  // Speak greeting
  setTimeout(() => {
    speak(`Hello ${firstName}! Welcome back to Bajaj Finance. I'm ARIA, your personal assistant. How can I help you today?`);
  }, 500);
}

// ── Quick Actions ──
function setupQuickButtons() {
  const btns = [
    { icon: '💰', text: 'EMI & Balance', query: 'What is my current EMI amount and outstanding balance?' },
    { icon: '📅', text: 'Tenure Remaining', query: 'How many months are remaining on my active loans?' },
    { icon: '✅', text: 'Repayment Status', query: 'What is my repayment status? Any missed payments?' },
    { icon: '📊', text: 'Loan Summary', query: 'Give me a complete summary of all my loan accounts' },
    { icon: '🏦', text: 'Interest Rate', query: 'What is the interest rate on my loans?' },
    { icon: '🤝', text: 'Mutual Funds', query: 'Tell me about Bajaj AMC mutual funds — which one would suit me?' },
  ];

  const container = document.getElementById('quick-btns');
  container.innerHTML = '';
  btns.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'quick-btn';
    btn.innerHTML = `<span>${b.icon}</span><span>${b.text}</span>`;
    btn.onclick = () => { sendMessage(b.query); };
    container.appendChild(btn);
  });
}

// ── Screen Transitions ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Main Init ──
async function init() {
  // Setup textarea auto-resize
  const input = document.getElementById('user-input');
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });

  // Send button
  document.getElementById('send-btn').onclick = () => sendMessage(input.value);

  // Voice button
  document.getElementById('voice-btn').onclick = toggleListening;

  // Stop speech on mic press
  document.getElementById('voice-btn').addEventListener('mousedown', () => {
    if (isSpeaking) stopSpeaking();
  });

  // Debug HUD toggle
  document.getElementById('debug-toggle').onclick = toggleDebugHUD;

  // Logout
  document.getElementById('logout-btn').onclick = () => {
    currentCustomer = null;
    currentLoans = [];
    conversationHistory = [];
    pitchMade = false;
    questionCount = 0;
    debugStats = { totalTokensIn: 0, totalTokensOut: 0, lastLatency: 0, requestCount: 0, lastModel: GEMINI_MODEL };
    showScreen('login-screen');
    document.getElementById('login-mobile').value = '';
    document.getElementById('login-error').classList.remove('show');
  };

  // Login form
  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const mobile = document.getElementById('login-mobile').value.trim();
    const btn = document.getElementById('login-btn');
    const error = document.getElementById('login-error');

    btn.disabled = true;
    btn.textContent = 'Verifying...';
    error.classList.remove('show');

    const found = await handleLogin(mobile);
    if (found) {
      renderSidebar();
      setupQuickButtons();
      showScreen('chat-screen');
      initVoice();
      setTimeout(showWelcomeMessage, 300);

      // Initialize debug HUD
      document.getElementById('dbg-model').textContent = GEMINI_MODEL;
      document.getElementById('dbg-mf-score').textContent = `${mfEligibility.score} (${mfEligibility.tier})`;
    } else {
      error.textContent = '❌ Mobile number not found. Please check and try again.';
      error.classList.add('show');
    }

    btn.disabled = false;
    btn.textContent = 'Continue →';
  };

  // Load CSV
  const csvLoaded = await loadCSV();
  if (!csvLoaded) {
    document.getElementById('login-error').textContent = '⚠️ Could not load customer data. Please refresh.';
    document.getElementById('login-error').classList.add('show');
  }

  // Start collapsed debug panel
  document.getElementById('debug-panel').classList.add('collapsed');

  // Init voices
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => { /* voices loaded */ };
    window.speechSynthesis.getVoices(); // trigger load
  }

  // Debug HUD initial values
  document.getElementById('dbg-model').textContent = GEMINI_MODEL;
}

// ── Start ──
document.addEventListener('DOMContentLoaded', init);
