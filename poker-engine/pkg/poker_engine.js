// Stub module for the Rust WASM engine.
// This allows Vite to resolve the import in development
// even if the real WASM build hasn't been generated yet.
// When you run `wasm-pack build --target web --out-dir pkg` in
// the `poker-engine` directory, this file will be replaced.

export default async function init() {
  // Force the caller's try/catch to fall back to the heuristic engine.
  throw new Error('WASM poker engine not built yet. Run `wasm-pack build` to generate it.');
}

export function calculate_equity_wasm() {
  // This should never be used; the TS code wraps the call in a try/catch
  // and will fall back to the heuristic implementation instead.
  throw new Error('WASM poker engine not built yet. Run `wasm-pack build` to generate it.');
}

