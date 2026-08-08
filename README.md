# ARIA — Bajaj Finance AI Assistant (Python/Flask port)

This is a Python (Flask) port of the original `webchat/` HTML+JS project.
Same UI, same behavior — but the CSV parsing, MF eligibility scoring,
system-prompt building, and the Gemini API call now all run **server-side**
in Python instead of in the browser.

## What changed vs. the original

- `funds.js` → `funds.py` (fund data + `getMFEligibilityScore`/`recommendFunds`, ported 1:1)
- `app.js`'s CSV loading, loan math, prompt building, and `callGemini()` →
  `app.py` (Flask routes: `/api/login`, `/api/chat`, `/api/logout`)
- `app.js`'s DOM rendering + Web Speech API (voice) logic stays in the browser
  as `static/app.js`, but now calls your Flask backend instead of Gemini directly
- `index.html` / `styles.css` are unchanged apart from asset paths
- **The Gemini API key is no longer in browser-visible code.** It's read from
  an environment variable on the server.

## ⚠️ Before you do anything else

The original `app.js` had a live Gemini API key hardcoded in it. Since that
file was shipped to the browser, that key has been publicly exposed.
**Revoke/rotate it in [Google AI Studio](https://aistudio.google.com/app/apikey)**
and generate a fresh one to use with this version — don't reuse the old one.

## Setup

```bash
cd webchat_flask
pip install -r requirements.txt
cp .env.example .env
# edit .env and paste your NEW Gemini API key
```

## Run

```bash
python app.py
```

Then open http://localhost:5000. Log in with any mobile number from
`Customer_Data_.csv` (e.g. `9625095466`).

## Notes / limitations

- Session state (conversation history, question count, MF eligibility) is kept
  in an in-memory Python dict keyed by a session cookie. That's fine for local
  dev / a single process, but won't survive a server restart and won't work
  across multiple worker processes — swap `SESSIONS` for Redis or a database
  if you deploy this for real.
- Voice input/output (Web Speech API) is a browser feature with no Python
  equivalent, so it's unchanged in `static/app.js`.
- `Customer_Data_.csv` contains synthetic-looking demo data (10,000 rows),
  not verified as real customer records — treat it as sample/test data either way.
