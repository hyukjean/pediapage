/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { getState } from './state';
import * as dom from './dom';
import type { Flashcard } from './types';

// --- API INITIALIZATION ---
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
  console.error('❌ Gemini API key not configured. Please set GEMINI_API_KEY in .env.local');
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

/**
 * Generates flashcards for a given topic using the Gemini API.
 * @param topic - The user-provided topic.
 * @returns A promise that resolves to an array of Flashcard objects.
 */
export async function generateFlashcards(topic: string): Promise<Flashcard[]> {
  // Check if API key is configured
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('API key not configured. Please set GEMINI_API_KEY in .env.local file. Get your FREE key at: https://aistudio.google.com/app/apikey');
  }

  console.log('🤖 Generating flashcards with Gemini API (FREE tier)...');
  
  const { currentLanguage, cardCountMode, contentDetail } = getState();
  const languageName = new Intl.DisplayNames([currentLanguage], { type: 'language' }).of(currentLanguage);
  let cardCount = dom.cardCountSlider.value;
  if (cardCountMode === 'auto') {
      cardCount = `${Math.floor(Math.random() * 8) + 5}`; // 5-12 cards
  }
  
  let prompt = `Generate ${cardCount} flashcards about "${topic}". The flashcards should be in ${languageName}.`;
  
  if (contentDetail === 'detailed') {
    prompt += ' The definition should be detailed and comprehensive.';
  } else {
    prompt += ' The definition should be concise.';
  }
  
  prompt += ` Return a JSON array of objects. Each object must have three properties: "term", "definition", and "importance" (a number from 1 to 10, where 10 is the most central concept to the main topic).`;

  const result = await ai.models.generateContent({ 
      model: 'gemini-2.0-flash-exp', // Using the latest free model
      contents: prompt,
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

  console.log('✅ Flashcards generated successfully with free Gemini API!');
  
  const responseText = result.text.trim();
  if (!responseText) {
    return [];
  }

  try {
    return JSON.parse(responseText) as Flashcard[];
  } catch (e) {
    console.error("Failed to parse JSON response:", e);
    console.log("Raw response:", responseText);
    return []; // Return empty array on parsing error
  }
}

/**
 * Generates a conversational response based on selected cards
 * @param selectedTerms - Array of selected card terms
 * @param question - User's question about the selected terms
 * @returns A promise that resolves to a concise answer
 */
export async function generateChatResponse(selectedTerms: string[], question: string): Promise<string> {
  // Check if API key is configured
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('API key not configured. Please set GEMINI_API_KEY in .env.local file. Get your FREE key at: https://aistudio.google.com/app/apikey');
  }

  console.log('🤖 Generating chat response with Gemini API (FREE tier)...');
  
  const { currentLanguage } = getState();
  const languageName = new Intl.DisplayNames([currentLanguage], { type: 'language' }).of(currentLanguage);
  
  let prompt = `You are a knowledgeable AI assistant. The user has selected these concepts: ${selectedTerms.join(', ')}. `;
  prompt += `They are asking: "${question}". `;
  prompt += `Please provide a concise, logical, and fundamental answer in ${languageName}. `;
  prompt += `Keep it brief but comprehensive, like Grok's style - direct, insightful, and to the point. `;
  prompt += `Focus on the core relationships and principles. Limit to 2-3 sentences maximum.`;

  const result = await ai.models.generateContent({ 
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
  });
  
  console.log('✅ Chat response generated successfully with free Gemini API!');
  
  const responseText = result.text.trim();
  return responseText || 'I couldn\'t generate a response. Please try again.';
}