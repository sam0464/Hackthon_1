# ARIA — Bajaj Finance AI Assistant

An AI-powered chat assistant for Bajaj Finance loan customers. Log in with a
registered mobile number to view loan details, ask questions about EMI,
outstanding balance, tenure, and repayment status, and get personalized
mutual fund recommendations from Bajaj AMC based on your financial profile.

## Features

- 🔐 Mobile-number login against customer account data
- 💬 Conversational assistant (powered by Google Gemini) that answers
  questions using your real loan data — EMI, outstanding balance, tenure,
  interest rate, repayment status
- 📊 Automatic wealth-profile scoring and tiered (Standard/Silver/Gold/Platinum)
  mutual fund eligibility check
- 📈 Fund recommendations and factsheet Q&A for 8 Bajaj AMC mutual funds
- 🎤 Voice input and text-to-speech (browser Web Speech API)
- 📟 Built-in observability panel — token usage, latency, request count

## Tech Stack

- Vanilla HTML / CSS / JavaScript (no framework, no build step)
- Google Gemini API for the conversational assistant
- Client-side CSV parsing for the demo customer dataset

## Setup

1. Clone this repo
2. Open `app.js` and replace `YOUR_GEMINI_API_KEY` with your own key from
3. Open `index.html` in a browser (or serve the folder with any static
   server, e.g. `npx serve .`)
4. Log in with any mobile number from `Customer_Data_.csv`

## ⚠️ Note on the API key

This is a client-side-only app, so the Gemini API key lives in `app.js` and
is visible to anyone who views the page source. That's fine for a local demo
or hackathon walkthrough, but **don't deploy this publicly with a real key
attached** — anyone could copy it and rack up usage on your account. For a
real deployment, move the Gemini calls to a backend (see the Flask version
of this project for that pattern) so the key never reaches the browser.

## Data

`Customer_Data_.csv` and `Factsheet_July-2026.pdf` are sample/demo data used
to power the assistant's responses for this project.
