import { Card, Rank, Suit } from '../types';

const API_BASE = typeof window !== 'undefined' ? '' : '';

export const analyzePokerTable = async (base64Image: string): Promise<{
  board: Card[];
  vibe: string;
}> => {
  try {
    const res = await fetch(`${API_BASE}/api/analyze-board`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.demo && data.board && data.vibe) {
        return {
          board: (data.board as { rank: string; suit: string }[]).map((c) => ({
            rank: c.rank as Rank,
            suit: c.suit as Suit,
          })),
          vibe: data.vibe,
        };
      }
      throw new Error(data.error || 'Failed to analyze image.');
    }

    const board: Card[] = (data.board || []).map((c: { rank: string; suit: string }) => ({
      rank: c.rank as Rank,
      suit: c.suit as Suit,
    }));

    return {
      board,
      vibe: data.vibe || 'Could not analyze board texture.',
    };
  } catch (err) {
    console.error('Analyze board error:', err);
    throw new Error('Failed to analyze image.');
  }
};
