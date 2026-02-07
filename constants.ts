import { Rank, Suit } from './types';

export const RANKS: Rank[] = [
  Rank.Ace, Rank.King, Rank.Queen, Rank.Jack, Rank.Ten, 
  Rank.Nine, Rank.Eight, Rank.Seven, Rank.Six, Rank.Five, 
  Rank.Four, Rank.Three, Rank.Two
];

export const SUITS: Suit[] = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];

// A simplified Sklansky-Chubukov ranking order (top ~50% roughly ordered for the slider)
// In a full app, this would be the complete 169 hand list.
export const SKLANSKY_ORDER: string[] = [
  "AA", "KK", "AKs", "QQ", "AKo", "JJ", "AQs", "TT", "AQo", "99",
  "AJs", "88", "ATs", "AJo", "77", "KQs", "ATo", "KJs", "66", "QJs",
  "KQo", "KTs", "QTs", "JTs", "55", "KJo", "QJo", "KTo", "QTo", "JTo",
  "44", "A9s", "A8s", "K9s", "A7s", "A5s", "A4s", "A3s", "A2s", "Q9s",
  "T9s", "J9s", "33", "22", "A9o", "K8s", "Q8s", "J8s", "T8s", "98s",
  "A8o", "K7s", "A7o", "K9o", "Q9o", "J9o", "T9o", "A6s", "A5o", "A4o",
  "A3o", "A2o", "K6s", "K5s", "Q7s", "J7s", "T7s", "97s", "87s", "K4s",
  "K3s", "K2s", "Q6s", "Q5s", "Q4s", "Q3s", "Q2s", "J6s", "J5s", "J4s",
  "J3s", "J2s", "T6s", "T5s", "T4s", "T3s", "T2s", "96s", "86s", "76s",
  "65s", "54s", "43s", "32s"
];

// Traditional deck: spades & clubs black, hearts & diamonds red
export const SUIT_COLORS: Record<Suit, string> = {
  [Suit.Spades]: 'text-slate-900 dark:text-slate-100',
  [Suit.Hearts]: 'text-red-600 dark:text-red-400',
  [Suit.Diamonds]: 'text-red-600 dark:text-red-400',
  [Suit.Clubs]: 'text-slate-900 dark:text-slate-100',
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.Spades]: '♠',
  [Suit.Hearts]: '♥',
  [Suit.Diamonds]: '♦',
  [Suit.Clubs]: '♣',
};

export const POKER_GLOSSARY: Record<string, string> = {
  "Wet Board": "A board texture with many potential draws (straights, flushes). Hand values can change rapidly on future streets.",
  "Dry Board": "A static board texture where made hands are unlikely to be outdrawn. Good for bluffs.",
  "Monotone": "A board where all cards are the same suit, heavily favoring flushes.",
  "Paired Board": "The board contains a pair (e.g., 8-8-K). This drastically increases the risk of Full Houses.",
  "Dynamic Texture": "A board with high cards and draws that interacts heavily with strong pre-flop ranges.",
  "Static Texture": "A board that is unlikely to change the nuts on future streets.",
  "Range Advantage": "When one player's range contains a significantly higher proportion of strong hands than the opponent's.",
  "Nut Advantage": "When one player holds more of the strongest possible hands (the nuts) than the opponent.",
  "Polarized": "A range constructed mostly of very strong hands and bluffs, lacking medium-strength hands.",
  "Capped": "A range that mathematically cannot contain the strongest possible hands (usually due to a lack of raising pre-flop).",
  "Value Bet": "Betting with a hand you expect to be ahead of the opponent's calling range.",
  "Protection": "Betting a made hand to force opponent folds and deny them their equity (prevent them from hitting a lucky card).",
  "Semi-Bluff": "Betting with a drawing hand (like a flush draw) that isn't the best now but has a good chance to improve.",
  "Equity": "The percentage share of the pot a hand expects to win in the long run.",
  "Draw Heavy": "A situation where many cards in the deck will complete a straight or flush."
};