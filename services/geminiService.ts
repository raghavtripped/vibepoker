import { GoogleGenAI, Type } from "@google/genai";
import { Card, Rank, Suit } from '../types';

// Initialize the API client
// Note: In a real deployment, ensure process.env.API_KEY is set in your build pipeline.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const analyzePokerTable = async (base64Image: string): Promise<{
  board: Card[],
  vibe: string
}> => {
  if (!apiKey) {
    console.warn("No API Key found. Returning mock data.");
    return {
      board: [
        { rank: Rank.Ace, suit: Suit.Spades },
        { rank: Rank.King, suit: Suit.Hearts },
        { rank: Rank.Ten, suit: Suit.Clubs }
      ],
      vibe: "Demo Mode: API Key missing. Showing example analysis."
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: `Analyze this poker table image. 
            1. Identify any visible board cards (community cards). 
            2. Provide a "Vibe Score" analysis: a short strategic summary of the texture (e.g., "Wet board, heavy draw potential").
            
            Return JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            boardCards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rank: { type: Type.STRING, description: "Rank: 2,3,4,5,6,7,8,9,T,J,Q,K,A" },
                  suit: { type: Type.STRING, description: "Suit: s,h,d,c" }
                }
              }
            },
            vibeAnalysis: { type: Type.STRING }
          }
        }
      }
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);

    // Map response to internal types
    const board: Card[] = (data.boardCards || []).map((c: any) => ({
      rank: c.rank as Rank,
      suit: c.suit as Suit
    }));

    return {
      board,
      vibe: data.vibeAnalysis || "Could not analyze board texture."
    };

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw new Error("Failed to analyze image.");
  }
};