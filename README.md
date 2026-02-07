# VibePoker Analytics

Poker range equity and board analysis, powered by a Rust WASM engine and optional Gemini vision for table scanning.

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies: `npm install`
2. (Optional) For “Scan Board” image analysis, set `GEMINI_API_KEY` in Vercel or in `.env.local`. For local API: `vercel dev` (so `/api/analyze-board` is available).
3. Run the app: `npm run dev`

## Deploy on Vercel

1. Push the repo and import the project in [Vercel](https://vercel.com).
2. (Optional) In **Project → Settings → Environment Variables**, add `GEMINI_API_KEY` for board image analysis.
3. Deploy; Vercel will use `vercel.json` (Vite + SPA rewrites) and run `npm run build`.

Build output is the `dist` folder; the `/api/analyze-board` serverless function runs on Vercel and keeps the API key server-side.

## WASM poker engine

Equity is computed by the in-repo Rust/WASM engine when built. To build it:

- Install [Rust](https://rustup.rs) and [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/).
- From project root: `cd poker-engine && wasm-pack build --target web --out-dir pkg`
- Commit the generated `poker-engine/pkg` (or run this step in CI and persist artifacts) so the built app can load it.

If the WASM build is not present, the app uses a built-in fallback equity estimate.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Engine:** Rust (WASM) for equity; optional Gemini API for board image analysis via `/api/analyze-board`
