// Simple payment integration with Stripe (or similar)
import { GoogleGenAI, Type } from '@google/genai';

const FREE_TIER_LIMITS = {
  dailyRequests: 5,
  maxCards: 5,
  basicModel: 'gemini-1.5-flash',
  languages: ['en', 'ko']
};

const PREMIUM_FEATURES = {
  unlimitedRequests: true,
  maxCards: 20,
  advancedModel: 'gemini-2.0-flash-exp',
  allLanguages: true,
  prioritySupport: true
};

// In production, this would check against your payment system
function checkSubscriptionStatus(userToken) {
  // Placeholder - integrate with Stripe, PayPal, etc.
  return {
    isPremium: false, // Check against your payment database
    subscriptionExpiry: null,
    features: FREE_TIER_LIMITS
  };
}

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { prompt, type = 'flashcards', language = 'en', cardCount } = JSON.parse(event.body);
    const userToken = event.headers.authorization?.replace('Bearer ', '');
    
    const subscription = checkSubscriptionStatus(userToken);
    
    // Free tier restrictions
    if (!subscription.isPremium) {
      if (!FREE_TIER_LIMITS.languages.includes(language)) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            error: 'Premium feature required',
            message: `Language "${language}" is only available for premium users`,
            upgrade: 'Upgrade to premium for all languages and unlimited usage!'
          }),
        };
      }
      
      if (cardCount > FREE_TIER_LIMITS.maxCards) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            error: 'Premium feature required',
            message: `Free users can generate up to ${FREE_TIER_LIMITS.maxCards} cards`,
            cardCount: Math.min(cardCount, FREE_TIER_LIMITS.maxCards)
          }),
        };
      }
    }

    const apiKey = process.env.DEMO_GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    
    // Use appropriate model based on subscription
    const model = subscription.isPremium ? 
      PREMIUM_FEATURES.advancedModel : 
      FREE_TIER_LIMITS.basicModel;

    if (type === 'flashcards') {
      const finalCardCount = subscription.isPremium ? 
        (cardCount || 10) : 
        Math.min(cardCount || 5, FREE_TIER_LIMITS.maxCards);
      
      const result = await ai.models.generateContent({ 
        model,
        contents: `Generate ${finalCardCount} flashcards about "${prompt}" in ${language}. Return JSON array with term, definition, importance.`,
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
          subscription: {
            tier: subscription.isPremium ? 'premium' : 'free',
            cardsGenerated: flashcards.length,
            upgradeMessage: !subscription.isPremium ? 
              'Upgrade to premium for unlimited cards and advanced features!' : null
          }
        }),
      };
    }
    
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Service error', details: error.message }),
    };
  }
}
