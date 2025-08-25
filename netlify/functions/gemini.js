import { GoogleGenAI, Type } from '@google/genai';

// Simple in-memory usage tracking (production에서는 Database 사용)
const usageTracker = new Map();
const DAILY_FREE_LIMIT = 10; // 사용자당 하루 10회 무료

function getClientId(event) {
  // IP 주소를 기반으로 한 간단한 클라이언트 식별
  const forwarded = event.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : event.headers['x-real-ip'] || 'unknown';
  return ip;
}

function checkUsageLimit(clientId, isLoggedInUser = false) {
  // Logged in users get unlimited access (or higher limits)
  if (isLoggedInUser) {
    return { allowed: true, remaining: -1 }; // -1 indicates unlimited
  }

  const today = new Date().toDateString();
  const key = `${clientId}-${today}`;
  const usage = usageTracker.get(key) || 0;
  
  if (usage >= DAILY_FREE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  return { allowed: true, remaining: DAILY_FREE_LIMIT - usage };
}

function incrementUsage(clientId, isLoggedInUser = false) {
  // Don't track usage for logged in users
  if (isLoggedInUser) {
    return;
  }

  const today = new Date().toDateString();
  const key = `${clientId}-${today}`;
  const usage = usageTracker.get(key) || 0;
  usageTracker.set(key, usage + 1);
}

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { prompt, type = 'flashcards', language = 'en', cardCount, contentDetail, userApiKey, isLoggedInUser } = JSON.parse(event.body);

    // Determine which API key to use
    let apiKey;
    if (isLoggedInUser && userApiKey) {
      // For now, still use demo key since we need Google Cloud Console setup for user keys
      // In production, this would validate and use the user's actual API key
      apiKey = process.env.DEMO_GEMINI_API_KEY;
      console.log('🔑 Using user API access (unlimited)');
    } else {
      apiKey = process.env.DEMO_GEMINI_API_KEY;
    }

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Demo service temporarily unavailable',
          solution: 'Deploy your own version with a personal API key for guaranteed availability!'
        }),
      };
    }

  const clientId = getClientId(event);
  const usage = checkUsageLimit(clientId, isLoggedInUser);

  // 사용량 제한 확인 (logged in users bypass this)
  if (!usage.allowed) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ 
        error: 'Daily free limit exceeded (10 requests/day)',
        message: 'To get unlimited access, deploy your own version with a personal API key!',
        resetTime: 'Midnight UTC',
        upgradeInfo: 'Get your FREE personal API key at https://aistudio.google.com/app/apikey'
      }),
    };
  }

    const ai = new GoogleGenAI({ apiKey });
    
    // 사용량 증가 (only for non-logged-in users)
    incrementUsage(clientId, isLoggedInUser);
    
    // 기존 AI 로직...
    if (type === 'flashcards') {
      // 카드 수량을 contentDetail에 따라 자동 결정
      let actualCardCount;
      if (contentDetail === 'detailed') {
        actualCardCount = Math.floor(Math.random() * 8) + 15; // 15-22 cards
      } else {
        actualCardCount = Math.floor(Math.random() * 3) + 7;  // 7-9 cards
      }
      
      let finalPrompt = `Generate exactly ${actualCardCount} flashcards about "${prompt}". `;
      
      const languageNames = {
        en: 'English', ko: 'Korean', ja: 'Japanese',
        de: 'German', it: 'Italian', no: 'Norwegian'
      };
      
      finalPrompt += `The flashcards should be in ${languageNames[language] || 'English'}. `;
      
      if (contentDetail === 'detailed') {
        finalPrompt += 'The definition should be detailed and comprehensive, with examples and context. ';
      } else {
        finalPrompt += 'The definition should be concise and to the point. ';
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
        body: JSON.stringify({ 
          data: flashcards,
          usage: {
            remaining: usage.remaining - 1,
            limit: DAILY_FREE_LIMIT,
            resetTime: 'Midnight UTC'
          }
        }),
      };
      
    } else if (type === 'chat') {
      const result = await ai.models.generateContent({ 
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          data: result.text.trim(),
          usage: {
            remaining: usage.remaining - 1,
            limit: DAILY_FREE_LIMIT,
            resetTime: 'Midnight UTC'
          }
        }),
      };
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate content',
        details: error.message,
        suggestion: 'Try again in a moment, or deploy your own version for guaranteed reliability!'
      }),
    };
  }
}
