// ============================================================
// Bajaj AMC Fund Factsheet Data — Extracted from July 2026 Factsheet
// Source: Factsheet_July-2026.pdf | Data as on 30th June 2026
// ============================================================

const BAJAJ_FUNDS = {
  "flexi_cap": {
    id: "flexi_cap",
    name: "Bajaj Finserv Flexi Cap Fund",
    shortName: "Flexi Cap Fund",
    category: "Flexi Cap Fund",
    type: "Equity",
    riskLevel: "Very High",
    objective: "To generate long term capital appreciation by investing predominantly in equity and equity related instruments across market capitalisation (large cap, mid cap & small cap stocks).",
    benchmark: "BSE 500 TRI",
    inceptionDate: "14th August 2023",
    aum: "₹7,748.37 Crore",
    nav: { directGrowth: 15.9480, regularGrowth: 15.3230 },
    expenseRatio: { regular: "1.53%", direct: "0.47%" },
    minInvestment: "₹500",
    minSIP: "₹500",
    exitLoad: "1% if redeemed within 6 months (first 10% units free); Nil after 6 months",
    fundManagers: ["Mr. Nimesh Chandan (26 yrs exp)", "Mr. Sorbh Gupta (20 yrs exp)", "Mr. Siddharth Chaudhary (Debt, 20 yrs exp)"],
    marketCapAllocation: { largeCap: "45.30%", midCap: "24.07%", smallCap: "28.57%", cashOthers: "2.06%" },
    portfolioQuants: { beta: 0.89, sharpeRatio: 0.79, jensensAlpha: "4.64%", stdDeviation: "13.32%", infoRatio: 0.91 },
    topSectors: ["Banks 18.60%", "Pharmaceuticals & Biotechnology 10.21%", "Consumer Durables 9.42%", "Industrial Products 6.78%", "Auto Components 5.72%"],
    topHoldings: ["ICICI Bank (5.49%)", "HDFC Bank (4.87%)", "Reliance Industries (3.71%)", "Federal Bank (2.85%)", "Divi's Laboratories (2.80%)", "K.P.R. Mill (2.77%)"],
    keyFeatures: [
      "Invests across all market caps — flexibility to chase best opportunities",
      "Active share of 69% — conviction-driven, not benchmark hugging",
      "AUM crossed ₹7,000 crore — strong investor trust",
      "96% of AUM outperforms benchmark since inception",
      "Delivered 16% returns vs 12.1% benchmark since inception"
    ],
    suitableFor: ["Long-term wealth creation (5+ years)", "Investors comfortable with equity volatility", "Those wanting diversification across market caps"],
    pitchScore: 5, // Score for how aggressively to pitch (1-5)
    emoji: "📈",
    color: "#6C63FF"
  },

  "large_mid_cap": {
    id: "large_mid_cap",
    name: "Bajaj Finserv Large and Mid Cap Fund",
    shortName: "Large & Mid Cap Fund",
    category: "Large and Mid Cap Fund",
    type: "Equity",
    riskLevel: "Very High",
    objective: "To generate long-term capital appreciation by investing in a diversified portfolio of equity and equity related securities, predominantly in large and mid-cap stocks from various sectors.",
    benchmark: "Nifty Large Midcap 250 TRI",
    inceptionDate: "27th February 2024",
    aum: "₹2,403.78 Crore",
    nav: { directGrowth: 12.6260, regularGrowth: 12.2030 },
    expenseRatio: { regular: "1.72%", direct: "0.52%" },
    minInvestment: "₹500",
    minSIP: "₹500",
    exitLoad: "1% if redeemed within 6 months (first 10% units free); Nil after 6 months",
    fundManagers: ["Mr. Nimesh Chandan (26 yrs exp)", "Mr. Sorbh Gupta (20 yrs exp)", "Mr. Siddharth Chaudhary (Debt, 20 yrs exp)"],
    marketCapAllocation: { largeCap: "42.84%", midCap: "38.12%", smallCap: "17.14%", cashOthers: "1.90%" },
    portfolioQuants: { beta: 0.83, sharpeRatio: 0.25, jensensAlpha: "1.16%", stdDeviation: "13.60%", infoRatio: 0.15 },
    topSectors: ["Banks 20.08%", "Auto Components 10.48%", "Pharmaceuticals & Biotechnology 8.90%", "Consumer Durables 7.71%", "Textiles & Apparels 5.62%"],
    topHoldings: ["ICICI Bank (5.10%)", "HDFC Bank (4.49%)", "Federal Bank (3.34%)", "Reliance Industries (3.34%)", "Berger Paints (3.33%)", "Divi's Laboratories (3.11%)"],
    keyFeatures: [
      "Blend of stability (large caps) + growth (mid caps)",
      "Economic Moat-based stock selection framework",
      "Minimum 35% each in large and mid caps — regulatory balance",
      "Positive Jensen's Alpha of 1.16% — adding value over benchmark"
    ],
    suitableFor: ["Medium to long-term (3–5+ years)", "Investors seeking growth with some stability", "Those wanting access to quality mid-cap companies"],
    pitchScore: 4,
    emoji: "🏗️",
    color: "#FF6B6B"
  },

  "liquid": {
    id: "liquid",
    name: "Bajaj Finserv Liquid Fund",
    shortName: "Liquid Fund",
    category: "Liquid Fund",
    type: "Debt",
    riskLevel: "Low to Moderate",
    objective: "To provide income consistent with preservation of capital, lower risk and high liquidity through investments in money market and debt securities with maturity up to 91 days only.",
    benchmark: "NIFTY Liquid Index A-I",
    inceptionDate: "5th July 2023",
    aum: "₹4,248.36 Crore",
    nav: { directGrowth: 1224.4250, regularGrowth: 1218.0113 },
    expenseRatio: { regular: "0.24%", direct: "0.07%" },
    minInvestment: "₹100",
    minSIP: "₹100",
    exitLoad: "Graded exit load (Days 1–6: 0.007%–0.004%); Nil from Day 7 onwards",
    fundManagers: ["Mr. Nimesh Chandan (26 yrs exp)", "Mr. Siddharth Chaudhary (20 yrs exp)", "Mr. Chirag Shah (14 yrs exp)"],
    portfolioAllocation: { certificateOfDeposit: "47.12%", commercialPaper: "39.43%", treasuryBills: "15.36%", corporateBonds: "11.38%", govtBonds: "2.42%" },
    portfolioQuants: { ytm: "6.40%", avgMaturity: "75 days", macaulayDuration: "75 days", modifiedDuration: "71 days" },
    assetQuality: "97.93% in AAA, AA+ or A1+ rated instruments",
    keyFeatures: [
      "Near-zero risk — invests only in instruments with max 91-day maturity",
      "97.93% AAA/A1+ rated — highest credit quality",
      "Instant redemption available (up to ₹50,000 or 90% of value)",
      "YTM of 6.40% — better than savings accounts",
      "Ideal for emergency funds or short-term cash parking",
      "AUM of ₹4,248 Crore — deep liquidity"
    ],
    suitableFor: ["Emergency fund management", "Short-term surplus (1 week to 3 months)", "Better returns vs savings account", "Sweep-in from salary account"],
    pitchScore: 3,
    emoji: "💧",
    color: "#4ECDC4"
  },

  "arbitrage": {
    id: "arbitrage",
    name: "Bajaj Finserv Arbitrage Fund",
    shortName: "Arbitrage Fund",
    category: "Arbitrage Fund",
    type: "Hybrid",
    riskLevel: "Low",
    objective: "To generate returns by investing in arbitrage opportunities in the cash and derivatives segments of the equity markets, and by investing the balance in debt and money market instruments.",
    benchmark: "Nifty 50 Arbitrage Index TRI",
    inceptionDate: "15th September 2023",
    aum: "₹924.31 Crore",
    nav: { directGrowth: 12.0980, regularGrowth: 11.8640 },
    expenseRatio: { regular: "0.89%", direct: "0.30%" },
    minInvestment: "₹500",
    exitLoad: "0.25% if redeemed within 15 days; Nil after 15 days",
    fundManagers: ["Mr. Ilesh Savla (26 yrs exp)", "Mr. Siddharth Chaudhary (Debt, 20 yrs exp)"],
    portfolioQuants: { beta: 0.55, sharpeRatio: 0.89, jensensAlpha: "-0.25%", ytm: "6.42%", avgMaturity: "120 days", stdDeviation: "0.91%" },
    marketCapAllocation: { largeCap: "76.18%", midCap: "19.28%", smallCap: "4.53%" },
    keyFeatures: [
      "Tax-efficient — treated as equity fund for taxation (≥65% in equity/arbitrage)",
      "Market-neutral strategy — profits from price difference between cash & futures",
      "Very low standard deviation of 0.91% — extremely stable returns",
      "Attractive Sharpe ratio of 0.89 — excellent risk-adjusted returns",
      "Better post-tax returns than FDs for investors in 30% bracket"
    ],
    taxBenefit: "Equity fund taxation — LTCG at 12.5% after 1 year (vs FD at slab rate)",
    suitableFor: ["Investors in 30% tax bracket", "Short to medium-term parking (3–12 months)", "Risk-averse investors wanting tax efficiency", "Corporate treasury management"],
    pitchScore: 4,
    emoji: "⚖️",
    color: "#F7DC6F"
  },

  "multi_asset": {
    id: "multi_asset",
    name: "Bajaj Finserv Multi Asset Allocation Fund",
    shortName: "Multi Asset Allocation Fund",
    category: "Multi Asset Allocation Fund",
    type: "Hybrid",
    riskLevel: "Very High",
    objective: "To generate income from fixed income instruments and generate capital appreciation by investing in equity and equity related securities including derivatives, Gold ETFs, Silver ETFs, exchange traded commodity derivatives and in units of REITs & InvITs.",
    benchmark: "65% Nifty 50 TRI + 25% NIFTY Short Duration Debt Index + 10% Domestic Prices of Gold",
    inceptionDate: "3rd June 2024",
    aum: "₹1,793.08 Crore",
    nav: { directGrowth: 12.3396, regularGrowth: 11.9601 },
    expenseRatio: { regular: "1.68%", direct: "0.43%" },
    minInvestment: "₹500",
    exitLoad: "1% if >30% redeemed within 3 months; Nil after 3 months",
    fundManagers: ["Mr. Anup Kulkarni (Equity, 18 yrs exp)", "Mr. Sabyasachi Mukerji (Equity, 11 yrs exp)", "Mr. Siddharth Chaudhary (Debt, 20 yrs exp)", "Mr. Cheragh Sidhwa (Commodity, 10 yrs exp)"],
    assetAllocation: { equity: "67.30%", etfs: "14.46%", reit: "3.88%", corporateBonds: "4.79%", certDeposits: "1.32%", govtBonds: "0.50%", other: "7.75%" },
    portfolioQuants: { beta: 1, sharpeRatio: 0.33, jensensAlpha: "1.79%", ytm: "6.98%", avgMaturity: "2.82 yrs", stdDeviation: "10.52%", infoRatio: 0.36 },
    topSectors: ["Banks 19.69%", "Pharmaceuticals 6.95%", "Telecom 4.12%", "Finance 3.93%", "Consumer Durables 3.21%"],
    goldSilverExposure: "Gold ETFs: ~14.46% (DSP Gold ETF, Kotak MF Gold ETF, Nippon Gold Bees, Mirae Gold ETF, DSP Silver ETF)",
    keyFeatures: [
      "True diversification — equity + debt + gold + silver + REITs",
      "Portfolio dividend yield of 2.1% vs benchmark 1.24%",
      "Inflation hedge through gold & silver exposure (~14.46%)",
      "Dynamic asset allocation across 4 asset classes",
      "Jensen's Alpha of 1.79% — delivering alpha over benchmark"
    ],
    suitableFor: ["Investors wanting one-fund diversification", "Long-term goals with inflation protection", "Moderate risk appetite seeking equity + gold hedge", "Goal-based investing (5+ years)"],
    pitchScore: 5,
    emoji: "🌐",
    color: "#A8E6CF"
  },

  "small_cap": {
    id: "small_cap",
    name: "Bajaj Finserv Small Cap Fund",
    shortName: "Small Cap Fund",
    category: "Small Cap Fund",
    type: "Equity",
    riskLevel: "Very High",
    objective: "To generate long term capital appreciation by investing in equity and equity related securities of small cap companies.",
    benchmark: "BSE 250 SmallCap TRI",
    inceptionDate: "18th July 2025",
    aum: "₹2,215.48 Crore",
    nav: { directGrowth: 10.8500, regularGrowth: 10.6920 },
    expenseRatio: { regular: "1.74%", direct: "0.52%" },
    minInvestment: "₹500",
    exitLoad: "1% within 6 months (first 10% free); Nil after 6 months",
    fundManagers: ["Mr. Nimesh Chandan (26 yrs exp)", "Mr. Sorbh Gupta (20 yrs exp)", "Mr. Siddharth Chaudhary (Debt, 20 yrs exp)"],
    marketCapAllocation: { midCap: "10.94%", smallCap: "87.34%", cashOthers: "1.72%" },
    topSectors: ["Industrial Products 13.26%", "Pharmaceuticals & Biotechnology 10.65%", "Consumer Durables 9.66%", "Auto Components 9.04%", "Electrical Equipment 6.62%"],
    topHoldings: ["Rubicon Research (4.18%)", "Welspun Corp (3.27%)", "S.J.S. Enterprises (3.18%)", "Neuland Laboratories (2.88%)", "Angel One (2.85%)"],
    keyFeatures: [
      "87% portfolio in pure small caps — true to its label",
      "3 investing styles: Growth + Quality + Value",
      "High growth potential — small caps can become tomorrow's mid/large caps",
      "Expert fund managers with proven track records"
    ],
    suitableFor: ["Aggressive investors with 7+ year horizon", "SIP investors wanting compounding over time", "Portfolio diversification in high-growth segment"],
    pitchScore: 3,
    emoji: "🚀",
    color: "#FF8C69"
  },

  "large_cap": {
    id: "large_cap",
    name: "Bajaj Finserv Large Cap Fund",
    shortName: "Large Cap Fund",
    category: "Large Cap Fund",
    type: "Equity",
    riskLevel: "Very High",
    objective: "To generate long term capital appreciation and income distribution by predominantly investing in equity and equity related instruments of large cap companies.",
    benchmark: "Nifty 100 TRI",
    inceptionDate: "20th August 2024",
    aum: "₹1,631.85 Crore",
    nav: { directGrowth: 10.1500, regularGrowth: 9.8710 },
    expenseRatio: { regular: "1.80%", direct: "0.52%" },
    minInvestment: "₹500",
    exitLoad: "1% if redeemed within 6 months; Nil after 6 months",
    fundManagers: ["Mr. Nimesh Chandan (26 yrs exp)", "Mr. Sorbh Gupta (20 yrs exp)", "Mr. Siddharth Chaudhary (Debt, 20 yrs exp)"],
    marketCapAllocation: { largeCap: "90.75%", midCap: "4.74%", smallCap: "0.81%", cashOthers: "3.70%" },
    portfolioQuants: { beta: 0.93, sharpeRatio: -0.47, jensensAlpha: "-0.36%", stdDeviation: "13.07%", infoRatio: 0.03 },
    topSectors: ["Banks 27.43%", "Consumer Durables 8.02%", "Pharmaceuticals & Biotechnology 7.31%", "Petroleum Products 6.99%", "Finance 5.43%"],
    topHoldings: ["HDFC Bank (9.01%)", "ICICI Bank (7.61%)", "Reliance Industries (6.99%)", "Bharti Airtel (4.08%)", "State Bank of India (4.08%)"],
    keyFeatures: [
      "90.75% in proven blue-chip large cap companies",
      "Stable and defensive — lower volatility than mid/small caps",
      "Active share of 43% — selective departures from index",
      "Backed by Bajaj Finserv's 100+ year legacy"
    ],
    suitableFor: ["Conservative equity investors", "First-time equity investors", "Long-term (5+ years) with moderate risk appetite"],
    pitchScore: 4,
    emoji: "🏛️",
    color: "#74B9FF"
  },

  "balanced_advantage": {
    id: "balanced_advantage",
    name: "Bajaj Finserv Balanced Advantage Fund",
    shortName: "Balanced Advantage Fund",
    category: "Balanced Advantage Fund",
    type: "Hybrid",
    riskLevel: "Moderately High",
    objective: "To capitalize on the potential upside of equities while attempting to limit the downside by dynamically managing the portfolio through investment in equity & equity related instruments and active use of debt, money market instruments and derivatives.",
    benchmark: "NIFTY 50 Hybrid Composite debt 50:50 Index",
    inceptionDate: "15th December 2023",
    aum: "₹1,129.80 Crore",
    nav: { directGrowth: 11.8800, regularGrowth: 11.4220 },
    expenseRatio: { regular: "1.83%", direct: "0.48%" },
    minInvestment: "₹500",
    exitLoad: "1% (>8% redeemed within 3 months); Nil after 3 months",
    fundManagers: ["Mr. Nimesh Chandan (26 yrs exp)", "Mr. Sorbh Gupta (20 yrs exp)", "Mr. Siddharth Chaudhary (Debt, 20 yrs exp)"],
    portfolioQuants: { beta: 1.36, sharpeRatio: -0.01, jensensAlpha: "-1.13%", ytm: "6.71%", avgMaturity: "3.18 yrs", stdDeviation: "9.98%", infoRatio: -0.23 },
    currentNetEquity: "88.48%",
    keyFeatures: [
      "Unique combination of fundamental + behavioural finance indicators",
      "Dynamic equity allocation (75%–88%) based on market valuations",
      "Lower volatility (StdDev 9.98%) vs pure equity funds",
      "Automatically reduces equity when markets are overvalued"
    ],
    suitableFor: ["Investors wanting equity growth with downside protection", "Moderate risk investors", "Those uncomfortable timing the market"],
    pitchScore: 4,
    emoji: "⚡",
    color: "#FD79A8"
  }
};

// Cross-sell scoring logic
function getMFEligibilityScore(customerLoans) {
  let score = 0;
  const reasons = [];

  // Get best metrics across all loans
  const hasActive = customerLoans.some(l => l.Loan_status === "Active");
  const appScore = parseFloat(customerLoans[0]?.App_score) || 0;
  const income = parseFloat(customerLoans[0]?.Imputed_Income) || 0;
  const hasCleanDPD = customerLoans.every(l => !l.DPD_30 && !l.DPD_90);
  const hasHomeLoan = customerLoans.some(l => l.Loan_type === "Home loan");
  const hasLAS = customerLoans.some(l => l.Loan_type === "Loan against securities");
  const loanCount = new Set(customerLoans.map(l => l.LAN)).size;
  const totalLoanValue = customerLoans.reduce((s, l) => s + (parseFloat(l.Loan_amount) || 0), 0);

  // Scoring
  if (appScore >= 8.5) { score += 3; reasons.push(`Excellent credit score (${appScore})`); }
  else if (appScore >= 7.5) { score += 2; reasons.push(`Good credit score (${appScore})`); }
  else if (appScore >= 6.5) { score += 1; reasons.push(`Fair credit score (${appScore})`); }

  if (hasCleanDPD) { score += 2; reasons.push("Clean repayment record (no defaults)"); }

  if (income >= 1500000) { score += 2; reasons.push(`High income (₹${(income/100000).toFixed(1)}L)`); }
  else if (income >= 800000) { score += 1; reasons.push(`Good income (₹${(income/100000).toFixed(1)}L)`); }

  if (hasActive) { score += 1; reasons.push("Active loan customer"); }
  if (hasHomeLoan || hasLAS) { score += 1; reasons.push("Holds premium loan products (Home/LAS)"); }
  if (loanCount >= 2) { score += 1; reasons.push(`Multi-product customer (${loanCount} loans)`); }
  if (totalLoanValue >= 5000000) { score += 1; reasons.push(`High-value customer (₹${(totalLoanValue/100000).toFixed(0)}L total loans)`); }

  return { score, reasons, eligible: score >= 4, tier: score >= 7 ? "Platinum" : score >= 5 ? "Gold" : score >= 4 ? "Silver" : "Standard" };
}

// Recommend best-fit funds based on customer profile
function recommendFunds(customerLoans, eligibility) {
  const recommendations = [];
  const income = parseFloat(customerLoans[0]?.Imputed_Income) || 0;
  const age = parseInt(customerLoans[0]?.Age) || 35;
  const appScore = parseFloat(customerLoans[0]?.App_score) || 0;
  const hasHomeLoan = customerLoans.some(l => l.Loan_type === "Home loan");
  const hasLAS = customerLoans.some(l => l.Loan_type === "Loan against securities");

  if (!eligibility.eligible) return [];

  // Always recommend liquid fund as easy entry
  recommendations.push({
    fund: BAJAJ_FUNDS.liquid,
    reason: "Perfect for parking your monthly surplus — earns more than savings account with instant liquidity",
    priority: 1
  });

  // For high income / high score — pitch multi-asset or flexi cap
  if (eligibility.score >= 6 && income >= 1200000) {
    recommendations.push({
      fund: BAJAJ_FUNDS.multi_asset,
      reason: "Given your strong financial profile, this fund gives you diversification across equity, debt, gold & REITs in a single investment",
      priority: 2
    });
  }

  if (appScore >= 8) {
    recommendations.push({
      fund: BAJAJ_FUNDS.flexi_cap,
      reason: "Your excellent credit profile reflects financial discipline — ideal to compound wealth in our flagship Flexi Cap fund across market cycles",
      priority: 2
    });
  }

  // LAS/Home loan customers are investment-savvy
  if (hasLAS || hasHomeLoan) {
    recommendations.push({
      fund: BAJAJ_FUNDS.large_mid_cap,
      reason: "As an existing home/securities loan customer, you understand long-term financial planning — complement it with this equity fund",
      priority: 3
    });
  }

  // Tax efficiency pitch for high income
  if (income >= 1500000) {
    recommendations.push({
      fund: BAJAJ_FUNDS.arbitrage,
      reason: "At your income level, the Arbitrage Fund offers equity taxation (LTCG at 12.5%) — much better than FD returns taxed at your slab rate",
      priority: 3
    });
  }

  // Age-based
  if (age < 40) {
    recommendations.push({
      fund: BAJAJ_FUNDS.flexi_cap,
      reason: "At your age, you have time on your side — a flexi cap fund can maximize compounding over the next 10–15 years",
      priority: 2
    });
  } else if (age > 50) {
    recommendations.push({
      fund: BAJAJ_FUNDS.balanced_advantage,
      reason: "The Balanced Advantage Fund dynamically manages equity-debt allocation — ideal as you approach your financial goals",
      priority: 3
    });
  }

  // Deduplicate by fund id
  const seen = new Set();
  return recommendations.filter(r => {
    if (seen.has(r.fund.id)) return false;
    seen.add(r.fund.id);
    return true;
  }).sort((a, b) => a.priority - b.priority).slice(0, 3);
}

// Export
window.BAJAJ_FUNDS = BAJAJ_FUNDS;
window.getMFEligibilityScore = getMFEligibilityScore;
window.recommendFunds = recommendFunds;
