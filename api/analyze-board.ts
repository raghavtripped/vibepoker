import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

export const config = {
  maxDuration: 30,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Gemini API not configured',
      demo: true,
      board: [
        { rank: 'A', suit: 's' },
        { rank: 'K', suit: 'h' },
        { rank: 'T', suit: 'c' },
      ],
      vibe: 'Demo Mode: Set GEMINI_API_KEY in Vercel to enable image analysis.',
    });
  }

  const body = req.body as { base64Image?: string };
  const base64Image = body?.base64Image;
  if (!base64Image || typeof base64Image !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid base64Image in body' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: `Analyze this poker table image. 
            1. Identify any visible board cards (community cards). 
            2. Provide a "Vibe Score" analysis: a short strategic summary of the texture (e.g., "Wet board, heavy draw potential").
            
            Return JSON with keys: boardCards (array of { rank, suit }), vibeAnalysis (string). 
            Use rank: 2,3,4,5,6,7,8,9,T,J,Q,K,A and suit: s,h,d,c.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            boardCards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rank: { type: Type.STRING },
                  suit: { type: Type.STRING },
                },
              },
            },
            vibeAnalysis: { type: Type.STRING },
          },
        },
      },
    });

    const jsonText = response.text || '{}';
    const data = JSON.parse(jsonText);
    const board = (data.boardCards || []).map((c: { rank: string; suit: string }) => ({
      rank: c.rank,
      suit: c.suit,
    }));

    return res.status(200).json({
      board,
      vibe: data.vibeAnalysis || 'Could not analyze board texture.',
    });
  } catch (err) {
    console.error('Gemini API error:', err);
    return res.status(500).json({ error: 'Failed to analyze image.' });
  }
}
