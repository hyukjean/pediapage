/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getState } from './state';
import * as dom from './dom';
import type { Flashcard } from './types';

// --- API CONFIGURATION ---
// Use different API endpoints based on environment
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8888/.netlify/functions'  // Development: Netlify Dev
  : '/.netlify/functions';  // Production: Netlify Functions

// For Vercel deployment, use this instead:
// const API_BASE_URL = import.meta.env.PROD 
//   ? '/api'  // Production: Vercel API routes
//   : 'http://localhost:3000/api';  // Development: Next.js dev server

/**
 * Generates flashcards for a given topic using serverless function.
 * @param topic - The user-provided topic.
 * @returns A promise that resolves to an array of Flashcard objects.
 */
export async function generateFlashcards(topic: string): Promise<Flashcard[]> {
  console.log('🤖 Generating flashcards with serverless Gemini API...');
  
  const { currentLanguage, cardCountMode, contentDetail } = getState();
  let cardCount = dom.cardCountSlider.value;
  if (cardCountMode === 'auto') {
      cardCount = `${Math.floor(Math.random() * 8) + 5}`; // 5-12 cards
  }

  try {
    const response = await fetch(`${API_BASE_URL}/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: topic,
        type: 'flashcards',
        language: currentLanguage,
        cardCount: cardCount,
        contentDetail: contentDetail
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Flashcards generated successfully with serverless API!');
    
    return result.data || [];
    
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Generates a conversational response based on selected cards
 * @param selectedTerms - Array of selected card terms
 * @param question - User's question about the selected terms
 * @returns A promise that resolves to a concise answer
 */
export async function generateChatResponse(selectedTerms: string[], question: string): Promise<string> {
  console.log('🤖 Generating chat response with serverless Gemini API...');
  
  const { currentLanguage } = getState();
  const languageName = new Intl.DisplayNames([currentLanguage], { type: 'language' }).of(currentLanguage);
  
  let prompt = `You are a knowledgeable AI assistant. The user has selected these concepts: ${selectedTerms.join(', ')}. `;
  prompt += `They are asking: "${question}". `;
  prompt += `Please provide a concise, logical, and fundamental answer in ${languageName}. `;
  prompt += `Keep it brief but comprehensive, like Grok's style - direct, insightful, and to the point. `;
  prompt += `Focus on the core relationships and principles. Limit to 2-3 sentences maximum.`;

  try {
    const response = await fetch(`${API_BASE_URL}/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        type: 'chat'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Chat response generated successfully with serverless API!');
    
    return result.data || 'I couldn\'t generate a response. Please try again.';
    
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}