use wasm_bindgen::prelude::*;
use rust_poker::equity;
use rust_poker::hand_range::HandRange;
use serde::Serialize;

#[derive(Serialize)]
pub struct EquityResult {
    pub hero_equity: f64,
    pub villain_equity: f64,
    pub tie_equity: f64,
}

#[wasm_bindgen]
pub fn calculate_equity_wasm(hero_range_str: &str, villain_range_str: &str, board_str: &str) -> JsValue {
    // 1. Parse Ranges
    let hero_range = HandRange::from_string(hero_range_str);
    let villain_range = HandRange::from_string(villain_range_str);
    
    let ranges = [hero_range, villain_range];
    
    // 2. Parse Board (handles empty string gracefully in most cases, but good to be safe)
    let board = equity::parse_board(board_str);

    // 3. Run Monte Carlo Simulation (100,000 iterations)
    // Uses the std_deck provided by the crate
    let result = equity::monte_carlo(&ranges, &board, &equity::get_std_deck(), 100_000);
    
    // 4. Calculate Totals
    let total = result.iter().sum::<u64>() as f64;
    
    // Safety check for 0 iterations (shouldn't happen with 100k requested)
    if total == 0.0 {
        return serde_json::to_value(&EquityResult {
            hero_equity: 0.0,
            villain_equity: 0.0,
            tie_equity: 0.0,
        }).unwrap().into();
    }

    // 5. Return JSON Object
    let equity_result = EquityResult {
        hero_equity: (result[0] as f64 / total) * 100.0,
        villain_equity: (result[1] as f64 / total) * 100.0,
        tie_equity: (result[2] as f64 / total) * 100.0,
    };

    serde_json::to_value(&equity_result).unwrap().into()
}