import { GoogleGenAI, Type } from '@google/genai';

export async function handler(event, context) {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { prompt, type = 'flashcards', language = 'en', cardCount, contentDetail } = JSON.parse(event.body);

    // Use user's API key or fallback to demo key
    const userApiKey = process.env.GEMINI_API_KEY;
    const demoApiKey = process.env.DEMO_GEMINI_API_KEY;
    const apiKey = userApiKey || demoApiKey;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API key not configured. Please set GEMINI_API_KEY in your Netlify environment variables.',
          instructions: 'Get your FREE API key at https://aistudio.google.com/app/apikey'
        }),
      };
    }

    // Log which key type is being used (for admin purposes)
    const isDemo = !userApiKey && demoApiKey;
    if (isDemo) {
      console.log('Using demo API key - shared rate limits apply');
    }

    const ai = new GoogleGenAI({ apiKey });
    
    if (type === 'flashcards') {
      // 플래시카드 생성 로직
      let finalPrompt = `Generate ${cardCount || 'auto'} flashcards about "${prompt}". `;
      
      const languageNames = {
        en: 'English',
        ko: 'Korean',
        ja: 'Japanese',
        de: 'German',
        it: 'Italian',
        no: 'Norwegian'
      };
      
      finalPrompt += `The flashcards should be in ${languageNames[language] || 'English'}. `;
      
      if (contentDetail === 'detailed') {
        finalPrompt += 'The definition should be detailed and comprehensive. ';
      } else {
        finalPrompt += 'The definition should be concise. ';
      }
      
      finalPrompt += 'Return a JSON array of objects. Each object must have three properties: "term", "definition", and "importance" (a number from 1 to 10, where 10 is the most central concept to the main topic).';

      const result = await ai.models.generateContent({ 
        model: 'gemini-2.0-flash-exp',
        contents: finalPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING },
                importance: { type: Type.NUMBER },
              },
              required: ["term", "definition", "importance"],
            },
          },
        }
      });
      
      const flashcards = JSON.parse(result.text.trim());
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: flashcards }),
      };
      
    } else if (type === 'chat') {
      // 채팅 응답 로직
      const result = await ai.models.generateContent({ 
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: result.text.trim() }),
      };
    }
    
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid request type' }),
    };
    
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate content', details: error.message }),
    };
  }
}
