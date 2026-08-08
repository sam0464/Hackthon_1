# ============================================================
# Bajaj Finance AI Assistant (ARIA) — Flask port of webchat/
# Ported from app.js + funds.js. The Gemini API call now happens
# server-side so the API key is never exposed to the browser.
# ============================================================
import csv
import math
import os
import re
import time
import uuid
from datetime import datetime, timedelta

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, session

from funds import BAJAJ_FUNDS, get_mf_eligibility_score, recommend_funds

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", os.urandom(32))

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_API_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
)

CSV_PATH = os.path.join(os.path.dirname(__file__), "Customer_Data_.csv")

# In-memory per-session state store (fine for a single-process demo;
# swap for Redis/DB if you need multi-worker / persistent sessions).
SESSIONS = {}

# ── CSV Loading ──────────────────────────────────────────────
CUSTOMER_DATA = {}  # { mobileNo: [ {row dict}, ... ] }


def load_csv():
    global CUSTOMER_DATA
    CUSTOMER_DATA = {}
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            mobile = (row.get("MobileNo") or "").strip()
            if not mobile:
                continue
            clean = {k: (v or "").strip() for k, v in row.items()}
            CUSTOMER_DATA.setdefault(mobile, []).append(clean)
    print(f"✅ Loaded {len(CUSTOMER_DATA)} unique customers")


# ── Loan computation helpers (port of app.js) ────────────────
def parse_dmy(date_str):
    if not date_str:
        return None
    parts = date_str.split("-")
    if len(parts) != 3:
        return None
    try:
        d, m, y = parts
        return datetime(int(y), int(m), int(d))
    except ValueError:
        return None


def format_inr(amount):
    try:
        num = float(amount)
    except (TypeError, ValueError):
        return "₹0"
    if math.isnan(num):
        return "₹0"
    if num >= 10_000_000:
        return f"₹{num / 10_000_000:.2f} Cr"
    if num >= 100_000:
        return f"₹{num / 100_000:.2f} L"
    if num >= 1_000:
        return f"₹{num / 1_000:.1f}K"
    return f"₹{num:.0f}"


def compute_loan_details(loan):
    disb_date = parse_dmy(loan.get("Disbursement_date"))
    today = datetime.now()
    months_elapsed = 0
    if disb_date:
        months_elapsed = int((today - disb_date).days / 30.44)
    tenure = int(loan.get("Tenure") or 0) if str(loan.get("Tenure") or "").strip().isdigit() else 0
    remaining_months = max(0, tenure - months_elapsed)
    emi = float(loan.get("EMI_amount") or 0) if loan.get("EMI_amount") else 0
    outstanding_principal = float(loan.get("Principal_amount") or 0) if loan.get("Principal_amount") else 0
    total_paid = min(months_elapsed, tenure) * emi
    interest_rate = float(loan.get("Interest") or 0) if loan.get("Interest") else 0

    formatted_disb_date = loan.get("Disbursement_date")
    if disb_date:
        formatted_disb_date = f"{disb_date.day} {disb_date.strftime('%b %Y')}"

    c = dict(loan)
    c.update({
        "monthsElapsed": months_elapsed,
        "remainingMonths": remaining_months,
        "totalPaid": total_paid,
        "outstandingPrincipal": outstanding_principal,
        "interestRate": interest_rate,
        "formattedDisbDate": formatted_disb_date,
        "isActive": loan.get("Loan_status") == "Active",
    })
    return c


# ── System prompt builder (port of buildSystemPrompt) ────────
def build_system_prompt(state):
    current_customer = state["current_customer"]
    current_loans = state["current_loans"]
    mf_eligibility = state["mf_eligibility"]
    mf_recommendations = state["mf_recommendations"]
    pitch_made = state["pitch_made"]

    loan_blocks = []
    for loan in current_loans:
        c = compute_loan_details(loan)
        loan_blocks.append(f"""
  - LAN: {c.get('LAN')} | Type: {c.get('Loan_type')} | Status: {c.get('Loan_status')}
    Amount: {format_inr(c.get('Loan_amount'))} | Interest: {c['interestRate'] * 100:.2f}% p.a.
    EMI: {format_inr(c.get('EMI_amount'))}/month | Tenure: {c.get('Tenure')} months
    Disbursed: {c['formattedDisbDate']} | Elapsed: {c['monthsElapsed']} months
    Remaining Tenure: {c['remainingMonths']} months | Outstanding: {format_inr(c['outstandingPrincipal'])}
    DPD 30: {c.get('DPD_30') or 'None'} | DPD 90: {c.get('DPD_90') or 'None'}""")
    loan_details = "\n".join(loan_blocks)

    fund_summary = "\n".join(
        f"  - {f['name']} ({f['category']}): {f['objective'][:100]}... "
        f"Risk: {f['riskLevel']}, AUM: {f['aum']}, Expense: {f['expenseRatio']['direct']} (Direct)"
        for f in BAJAJ_FUNDS.values()
    )

    top_fund_details = []
    for f in list(BAJAJ_FUNDS.values())[:5]:
        top_fund_details.append(f"""
  === {f['name']} ===
  Category: {f['category']} | Risk: {f['riskLevel']}
  AUM: {f['aum']} | Benchmark: {f['benchmark']}
  NAV (Direct Growth): ₹{f['nav']['directGrowth']}
  Expense Ratio: Regular {f['expenseRatio']['regular']}, Direct {f['expenseRatio']['direct']}
  Exit Load: {f['exitLoad']}
  Min Investment: {f['minInvestment']}
  Inception: {f['inceptionDate']}
  Top Sectors: {', '.join(f.get('topSectors', [])[:3])}
  Key Features: {'; '.join(f.get('keyFeatures', [])[:3])}
  Suitable For: {', '.join(f.get('suitableFor', []))}
  """)
    top_fund_details_str = "\n".join(top_fund_details)

    eligibility_ctx = ""
    if mf_eligibility:
        eligibility_ctx = f"""
MF CROSS-SELL ELIGIBILITY:
  Score: {mf_eligibility['score']}/11 | Tier: {mf_eligibility['tier']} | Eligible: {mf_eligibility['eligible']}
  Qualifying reasons: {', '.join(mf_eligibility['reasons'])}
  Recommended funds (in order): {', '.join(r['fund']['name'] for r in mf_recommendations)}
  """

    today_str = datetime.now().strftime("%A, %B %d, %Y")
    pitch_status = "already pitched" if pitch_made else "answering 2+ loan questions, naturally introduce mutual funds"
    eligible_status = "ELIGIBLE (do pitch!)" if (mf_eligibility and mf_eligibility["eligible"]) else "not eligible (skip pitch)"

    return f"""You are ARIA — an intelligent AI Banking Assistant for Bajaj Finance Limited. You serve existing loan customers.

TODAY'S DATE: {today_str}

CUSTOMER PROFILE:
  Name: {current_customer['Name']}
  Mobile: {current_customer['MobileNo']}
  Age: {current_customer['Age']} | Gender: {current_customer['Gender']}
  Employment: {current_customer['Employment_type']}
  Estimated Monthly Income: {format_inr(current_customer['Imputed_Income'])}
  App Credit Score: {current_customer['App_score']}/10
  Pincode: {current_customer['PIncode']}

LOAN ACCOUNTS:
{loan_details}

{eligibility_ctx}

BAJAJ AMC MUTUAL FUND FACTSHEET (July 2026 — Source of Truth):
Available Funds:
{fund_summary}

Detailed Fund Data:
{top_fund_details_str}

BEHAVIORAL RULES:
1. LOAN QUERIES: Always reference the exact loan data provided. Compute remaining months, outstanding balances, EMI details accurately. If multiple loans exist, clarify which one you're referring to.
2. FUND PITCH TIMING: After {pitch_status}. Only pitch if customer is {eligible_status}.
3. FUND INFORMATION: Answer ALL mutual fund questions using ONLY the factsheet data provided. Never hallucinate fund performance.
4. TONE: Be warm, conversational, professional. Use Indian financial context (₹, lakhs, crores). Address customer by first name.
5. CROSS-SELL APPROACH: Frame mutual funds as wealth-building opportunities complementary to their loan, not as a sales pitch. Be natural, not pushy.
6. DISCLAIMER: When discussing mutual fund returns or recommendations, always add: "Mutual fund investments are subject to market risks. Please read all scheme related documents carefully."
7. FORMATTING: Use markdown for structure. Keep responses concise but complete. Use bullet points for lists.

IMPORTANT: You have access to exact loan data. Do NOT say you cannot access account information — you CAN and SHOULD use the data provided above."""


# ── Gemini call (port of callGemini) ──────────────────────────
def call_gemini(state, user_message):
    state["conversation_history"].append({"role": "user", "parts": [{"text": user_message}]})

    payload = {
        "system_instruction": {"parts": [{"text": build_system_prompt(state)}]},
        "contents": state["conversation_history"],
        "generationConfig": {"temperature": 0.7, "topP": 0.95, "maxOutputTokens": 1024},
    }

    start = time.time()
    resp = requests.post(
        GEMINI_API_URL,
        params={"key": GEMINI_API_KEY},
        json=payload,
        timeout=30,
    )
    latency_ms = round((time.time() - start) * 1000)

    if not resp.ok:
        try:
            err = resp.json()
            msg = err.get("error", {}).get("message", f"API Error {resp.status_code}")
        except Exception:
            msg = f"API Error {resp.status_code}"
        raise RuntimeError(msg)

    data = resp.json()
    assistant_text = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "I'm sorry, I couldn't generate a response. Please try again.")
    )

    state["conversation_history"].append({"role": "model", "parts": [{"text": assistant_text}]})

    usage = data.get("usageMetadata", {})
    prompt_tokens = usage.get("promptTokenCount", 0)
    completion_tokens = usage.get("candidatesTokenCount", 0)
    state["debug"]["totalTokensIn"] += prompt_tokens
    state["debug"]["totalTokensOut"] += completion_tokens
    state["debug"]["lastLatency"] = latency_ms
    state["debug"]["requestCount"] += 1
    state["debug"]["lastModel"] = data.get("modelVersion", GEMINI_MODEL)

    return assistant_text, {
        "promptTokens": prompt_tokens,
        "completionTokens": completion_tokens,
        "latency": latency_ms,
        "model": state["debug"]["lastModel"],
    }


# ── Session helpers ────────────────────────────────────────────
def get_state():
    sid = session.get("sid")
    if not sid or sid not in SESSIONS:
        return None
    return SESSIONS[sid]


def new_state(loans):
    sid = str(uuid.uuid4())
    session["sid"] = sid
    eligibility = get_mf_eligibility_score(loans)
    recommendations = recommend_funds(loans, eligibility)
    state = {
        "current_customer": loans[0],
        "current_loans": loans,
        "conversation_history": [],
        "mf_eligibility": eligibility,
        "mf_recommendations": recommendations,
        "pitch_made": False,
        "question_count": 0,
        "debug": {
            "totalTokensIn": 0,
            "totalTokensOut": 0,
            "lastLatency": 0,
            "requestCount": 0,
            "lastModel": GEMINI_MODEL,
        },
    }
    SESSIONS[sid] = state
    return state


# ── Routes ──────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/login", methods=["POST"])
def api_login():
    body = request.get_json(force=True) or {}
    mobile = (body.get("mobile") or "").strip()
    loans = CUSTOMER_DATA.get(mobile)
    if not loans:
        return jsonify({"success": False, "error": "Mobile number not found. Please check and try again."}), 404

    state = new_state(loans)
    customer = state["current_customer"]

    unique_loans = {}
    for l in loans:
        unique_loans.setdefault(l["LAN"], l)

    loan_cards = []
    for loan in unique_loans.values():
        c = compute_loan_details(loan)
        loan_cards.append({
            "LAN": c["LAN"],
            "loanType": c["Loan_type"],
            "status": c["Loan_status"],
            "amountFormatted": format_inr(c.get("Loan_amount")),
        })

    return jsonify({
        "success": True,
        "customer": {
            "name": customer["Name"],
            "firstName": customer["Name"].split(" ")[0],
            "initials": customer["Name"][:2].upper(),
        },
        "loans": loan_cards,
        "activeCount": sum(1 for l in loans if l["Loan_status"] == "Active"),
        "closedCount": sum(1 for l in loans if l["Loan_status"] == "Closed"),
        "eligibility": state["mf_eligibility"],
        "model": GEMINI_MODEL,
    })


@app.route("/api/logout", methods=["POST"])
def api_logout():
    sid = session.pop("sid", None)
    if sid:
        SESSIONS.pop(sid, None)
    return jsonify({"success": True})


@app.route("/api/chat", methods=["POST"])
def api_chat():
    state = get_state()
    if not state:
        return jsonify({"error": "Not logged in"}), 401

    body = request.get_json(force=True) or {}
    text = (body.get("message") or "").strip()
    if not text:
        return jsonify({"error": "Empty message"}), 400

    if not GEMINI_API_KEY:
        return jsonify({
            "reply": "⚠️ **API Key Required**\n\nSet the `GEMINI_API_KEY` environment variable on the server "
                      "(see `.env.example`) and restart the app.",
            "pitch": None,
            "debug": None,
        })

    state["question_count"] += 1

    try:
        reply, debug_info = call_gemini(state, text)
    except Exception as e:
        return jsonify({
            "reply": f"❌ **Error:** {e}\n\nPlease check your API key and try again.",
            "pitch": None,
            "debug": None,
        })

    should_pitch = (
        not state["pitch_made"]
        and state["mf_eligibility"]
        and state["mf_eligibility"]["eligible"]
        and state["question_count"] >= 2
    )
    looks_like_mf_topic = bool(re.search(r"mutual fund|invest|wealth|saving|return|grow", text, re.I))

    pitch_payload = None
    if should_pitch and not looks_like_mf_topic:
        state["pitch_made"] = True
        rec = state["mf_recommendations"][0] if state["mf_recommendations"] else None
        if rec:
            tier = state["mf_eligibility"]["tier"]
            tier_emoji = {"Platinum": "💎", "Gold": "🥇", "Silver": "🥈", "Standard": "📊"}.get(tier, "📊")
            first_name = state["current_customer"]["Name"].split(" ")[0]
            pitch_text = f"""
{tier_emoji} **{first_name}, a quick thought while we're talking…**

Based on your excellent financial profile — clean repayment history, strong credit score, and consistent income — you qualify for our **{tier} Tier** wealth program.

Many Bajaj Finance customers like you are building wealth alongside their loan repayments. Since you're already disciplined with your EMIs, that same discipline can compound beautifully in mutual funds.

I'd especially recommend looking at the **{rec['fund']['name']}** for you. {rec['reason']}.

Would you like to know more about this fund, or shall I suggest a SIP amount that fits alongside your current EMI?

*Mutual fund investments are subject to market risks. Please read all scheme related documents carefully.*"""
            pitch_payload = {
                "text": pitch_text,
                "fund": {
                    "id": rec["fund"]["id"],
                    "name": rec["fund"]["name"],
                    "category": rec["fund"]["category"],
                    "emoji": rec["fund"]["emoji"],
                    "aum": rec["fund"]["aum"],
                    "expenseDirect": rec["fund"]["expenseRatio"]["direct"],
                    "riskLevel": rec["fund"]["riskLevel"],
                    "minInvestment": rec["fund"]["minInvestment"],
                    "reason": rec["reason"],
                },
            }
    elif should_pitch:
        state["pitch_made"] = True

    return jsonify({
        "reply": reply,
        "pitch": pitch_payload,
        "debug": {
            **debug_info,
            "totalTokens": state["debug"]["totalTokensIn"],
            "requestCount": state["debug"]["requestCount"],
            "questionCount": state["question_count"],
            "mfScoreTier": f"{state['mf_eligibility']['score']} ({state['mf_eligibility']['tier']})" if state["mf_eligibility"] else "N/A",
        },
    })


@app.route("/api/fund/<fund_id>")
def api_fund(fund_id):
    fund = BAJAJ_FUNDS.get(fund_id)
    if not fund:
        return jsonify({"error": "not found"}), 404
    return jsonify(fund)


if __name__ == "__main__":
    load_csv()
    app.run(debug=True, port=5000)
