# PinkAware: Gemma 4 Breast Cancer Research & Awareness App

A simple, beginner-friendly web application powered by **Gemma 4**. It helps young adult women explore pre-disposing risk factors for breast cancer, understand the predominant causes, and take positive, proactive steps to protect their health.

---

## What It Does

1. **Intake for Young Women:** Takes 3 key pieces of information:
   - **Date of Birth** (calculates exact age for young adult considerations, ages 18–39)
   - **Maternal History** (whether your biological mother had breast cancer, and at what age)
   - **Marital & Reproductive Status** (correlating with hormonal timing and reproductive milestones)
2. **Predominant Cause Analysis:** Explains the science behind genetic inheritance (like BRCA genes), hormonal windows, and dense breast tissue in simple everyday words.
3. **Personalized Prevention Checklist:** Gives an interactive checklist of monthly breast self-awareness, clinical checkup schedules, and healthy lifestyle choices.
4. **Doctor Discussion Guide:** Prepares 5 specific, high-yield questions you can bring directly to your doctor or gynecologist.

---

## Dual Provider Support

This project supports two ways to run Gemma 4 without changing any application code:

| Provider | Description | How to select |
|---|---|---|
| **Google AI Studio (API)** | Cloud-hosted Gemma 4 (`gemma-4-26b-a4b-it`) via Gemini API. Fast, zero-setup. | `PROVIDER=api` (Default) |
| **Ollama (Local)** | Self-hosted offline Gemma 4 (`gemma4:e2b`) on your computer. | `PROVIDER=local` |

---

## Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the example file:
```bash
cp .env.example .env
```

Open `.env` and verify your settings:
```ini
# Choose 'api' or 'local'
PROVIDER="api"

# When using Google AI Studio (API):
GEMINI_API_KEY="your_api_key_here"
GEMMA_API_MODEL="gemma-4-26b-a4b-it"

# When using Ollama (Local):
OLLAMA_ENDPOINT="http://localhost:11434"
OLLAMA_MODEL="gemma4:e2b"
```

> **Security Note:** Your `GEMINI_API_KEY` stays 100% on the server side. It is never sent to or visible in the web browser.

---

## Running the App

### Option A: Run with Google AI Studio (API)
1. Make sure `PROVIDER="api"` is in your `.env` (or environment).
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser at: `http://localhost:3000`

### Option B: Run with Ollama (Local Fallback)
1. Install and start [Ollama](https://ollama.com).
2. Pull the Gemma 4 model in your terminal:
   ```bash
   ollama run gemma4:e2b
   ```
3. In `.env`, change:
   ```ini
   PROVIDER="local"
   ```
4. Start the app:
   ```bash
   npm run dev
   ```
5. Open your browser at: `http://localhost:3000`

---

## Running the Smoke Test

We included a smoke test that sends a realistic sample case (27-year-old female, mother diagnosed with breast cancer at age 48) through the active provider and prints `PASS` or `FAIL`.

Run the test:
```bash
npm run smoke-test
```

Example successful output:
```text
========================================================
   PINKAWARE GEMMA 4 SMOKE TEST
========================================================
Active Provider: API
API Model:       gemma-4-26b-a4b-it
...
RESULT: PASS
========================================================
```

---

## Project Structure

- `src/App.tsx` — Single-page React user interface (responsive, accessible, clean).
- `src/server/gemmaProvider.ts` — Unified Gemma 4 provider connecting to Google AI Studio API or Ollama.
- `src/server/handler.ts` — Server-side API endpoints (`/api/analyze`, `/api/health`, `/api/config`).
- `src/types.ts` — TypeScript types for inputs, factors, and prevention checklists.
- `scripts/smoke-test.ts` — Automated verification script that tests end-to-end analysis and outputs `PASS`/`FAIL`.
- `server.ts` — Standalone Express server for production deployments.
- `.env.example` — Template for environment variables.
- `.gitignore` — Keeps API keys and `.env` strictly out of version control.
