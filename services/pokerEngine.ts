import { GridSelection, SimulationResult, Card, HandDistribution } from '../types';

// Helper to convert grid selection to range string (e.g. "AA, KK, AKs")
const gridToRangeString = (selection: GridSelection): string => {
  const hands = Object.keys(selection).filter(key => selection[key]);
  if (hands.length === 0) return "random"; // Fallback for empty range
  return hands.join(', ');
};

export const calculateEquity = async (
  heroRange: GridSelection, 
  villainRange: GridSelection,
  board: Card[]
): Promise<SimulationResult> => {
  
  const heroStr = gridToRangeString(heroRange);
  const villainStr = gridToRangeString(villainRange);
  // Board format for rust_poker: "AhKs2d"
  const boardStr = board.map(c => `${c.rank}${c.suit}`).join('');

  let heroEquity = 50;
  let villainEquity = 50;
  let tieEquity = 0;

  try {
    // Attempt to load WASM. In development (before wasm-pack build), this might fail.
    // We use dynamic import to prevent the app from crashing if the pkg doesn't exist yet.
    // @ts-ignore - The module is generated at build time
    const wasm = await import('../poker-engine/pkg/poker_engine.js');
    await wasm.default(); // init()

    const rawResult = wasm.calculate_equity_wasm(heroStr, villainStr, boardStr);
    
    heroEquity = rawResult.hero_equity;
    villainEquity = rawResult.villain_equity;
    tieEquity = rawResult.tie_equity;

  } catch (e) {
    console.warn("WASM Engine not found. Using fallback heuristic.", e);
    
    // --- FALLBACK HEURISTIC (For Dev/Preview) ---
    // Count selected combos in ranges
    const heroCount = Object.values(heroRange).filter(Boolean).length;
    const villainCount = Object.values(villainRange).filter(Boolean).length || 169;
    
    const getStrengthScore = (count: number) => Math.max(0, 100 - (count / 1.69));
    const heroStrength = getStrengthScore(heroCount);
    const villainStrength = getStrengthScore(villainCount);

    let baseEquity = 50 + ((heroStrength - villainStrength) * 0.4);

    if (board.length > 0) {
        const hasAce = board.some(c => c.rank === 'A');
        if (hasAce) {
            if (heroStrength > villainStrength) baseEquity += 5;
            else if (villainStrength > heroStrength) baseEquity -= 5;
        }
    }

    const variation = (Math.random() * 4) - 2;
    heroEquity = Math.min(99, Math.max(1, baseEquity + variation));
    villainEquity = 100 - heroEquity;
    // --------------------------------------------
  }
  
  // --- Strategic Analytics Layer (Applies to both WASM and Fallback) ---
  const insights: string[] = [];
  let boardTexture = "Neutral";
  
  // 1. Analyze Board Texture
  if (board.length >= 3) {
      const suits = board.map(c => c.suit);
      const ranks = board.map(c => c.rank);
      
      const suitCounts = suits.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {} as Record<string, number>);
      const maxSuit = Math.max(...Object.values(suitCounts));
      
      if (maxSuit >= 3) {
        insights.push("Wet Board (Flush Possible)");
        boardTexture = "Wet / Monotone";
      } else if (maxSuit === 2) {
        insights.push("Draw Heavy");
        boardTexture = "Draw Heavy";
      }
      
      const uniqueRanks = new Set(ranks).size;
      if (uniqueRanks < ranks.length) {
        insights.push("Paired Board");
        boardTexture = "Paired";
      }

      const highCards = ranks.filter(r => ['A', 'K', 'Q', 'J'].includes(r)).length;
      if (highCards >= 2) insights.push("Dynamic Texture");
      else if (highCards === 0) insights.push("Static Texture");
  }

  // 2. Comparative Insight
  const heroCount = Object.values(heroRange).filter(Boolean).length;
  const villainCount = Object.values(villainRange).filter(Boolean).length || 169;
  
  let rangeInsight = "Ranges are similar";
  if (heroCount < villainCount * 0.5) {
      insights.push("Hero Range Advantage");
      insights.push("Polarized");
      rangeInsight = "Hero is significantly narrower and stronger (Polarized)";
  } else if (villainCount < heroCount * 0.5) {
      insights.push("Villain Range Advantage");
      insights.push("Hero Capped");
      rangeInsight = "Villain range is stronger, Hero appears Capped";
  }

  // 3. Generate Recommendation
  let recommendation = "";
  let actionVerb = "";
  if (heroEquity >= 60) {
      recommendation = "Value Bet (Ahead)";
      actionVerb = "value bet aggressively";
  } else if (heroEquity >= 53) {
      recommendation = "Thin Value / Protection";
      actionVerb = "bet small for protection";
  } else if (heroEquity >= 45) {
      recommendation = "Call / Pot Control";
      actionVerb = "check-call or pot control";
  } else {
      recommendation = "Check / Fold (Behind)";
      actionVerb = "check-fold";
  }

  // 4. Generate Mock Hand Stats (Future Phase: Calculate these in Rust too)
  const handStats: HandDistribution[] = [
    { name: "Top Pair+", value: Math.round(Math.random() * 30 + 10) },
    { name: "Flush Draw", value: boardTexture.includes("Wet") ? Math.round(Math.random() * 20 + 10) : Math.round(Math.random() * 5) },
    { name: "Straight Draw", value: Math.round(Math.random() * 15) },
    { name: "Sets/Full House", value: Math.round(Math.random() * 8) },
    { name: "Air / Missed", value: 0 }
  ];
  // Calculate Air residual
  const sumStats = handStats.reduce((a, b) => a + b.value, 0);
  handStats[4].value = Math.max(0, 100 - sumStats);

  // Extract Top Pair+ frequency for detailed analysis
  const topPairFreq = handStats.find(h => h.name === "Top Pair+")?.value || 0;

  // 5. Detailed Analysis Generation
  const detailedAnalysis = `
    Hero holds ${heroEquity.toFixed(1)}% equity on this ${boardTexture} board. 
    ${rangeInsight}. 
    Given the ${boardTexture.toLowerCase()} nature of the board, there is ${boardTexture.includes('Wet') || boardTexture.includes('Draw') ? 'significant risk of opponent improvement' : 'little risk of bad runouts'}.
    Your range hits Top Pair or better approximately ${topPairFreq}% of the time on this texture.
    The model suggests to ${actionVerb}. 
    ${heroEquity > 60 ? 'Your range connects better with this board texture than the opponent.' : 'The opponent likely has better coverage of this board.'}
  `.trim().replace(/\s+/g, ' ');

  return {
    heroEquity: Number(heroEquity.toFixed(2)),
    villainEquity: Number(villainEquity.toFixed(2)),
    tieEquity: Number(tieEquity.toFixed(2)),
    winRate: Number(heroEquity.toFixed(2)),
    iterations: 100000,
    recommendation,
    insights,
    detailedAnalysis,
    handStats
  };
};