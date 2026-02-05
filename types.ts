export enum Suit {
  Spades = 's',
  Hearts = 'h',
  Diamonds = 'd',
  Clubs = 'c',
}

export enum Rank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = 'T',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
}

export interface Card {
  rank: Rank;
  suit: Suit;
}

export interface HandCombo {
  combo: string; // e.g., "AKs", "TT", "72o"
  selected: boolean;
}

export interface HandDistribution {
  name: string; // e.g. "Top Pair", "Flush Draw"
  value: number; // 0-100
}

export interface SimulationResult {
  heroEquity: number;
  villainEquity: number;
  tieEquity: number;
  winRate: number;
  iterations: number;
  // New Analytics Fields
  recommendation: string; // e.g., "Value Bet (High Confidence)"
  insights: string[]; // e.g., ["Wet Board", "Range Advantage"]
  detailedAnalysis: string; // A paragraph explaining the logic
  handStats: HandDistribution[];
}

export type GridSelection = Record<string, boolean>; // Key is "AA", "AKs", etc. value is isSelected

export interface SavedScenario {
  id: string;
  name: string;
  heroRange: GridSelection;
  villainRange: GridSelection;
  timestamp: number;
}