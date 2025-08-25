import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const { prompt, type = 'flashcards' } = await request.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    if (type === 'flashcards') {
      // 기존 generateFlashcards 로직
      const result = await ai.models.generateContent({ 
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                term: { type: "string" },
                definition: { type: "string" },
                importance: { type: "number" },
              },
              required: ["term", "definition", "importance"],
            },
          },
        }
      });
      
      return NextResponse.json({ data: JSON.parse(result.text) });
    } else if (type === 'chat') {
      // 채팅 응답 로직
      const result = await ai.models.generateContent({ 
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });
      
      return NextResponse.json({ data: result.text });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
