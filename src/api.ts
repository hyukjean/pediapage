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
 * Shows usage notification to the user
 */
function showUsageNotification(message: string, type: 'info' | 'warning' | 'error') {
  // Simple notification system
  const notification = document.createElement('div');
  notification.className = `usage-notification ${type}`;
  notification.textContent = message;
  
  // Style the notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    backdrop-filter: blur(10px);
    transition: opacity 0.3s ease;
    ${type === 'info' ? 'background: rgba(59, 130, 246, 0.9);' : ''}
    ${type === 'warning' ? 'background: rgba(245, 158, 11, 0.9);' : ''}
    ${type === 'error' ? 'background: rgba(239, 68, 68, 0.9);' : ''}
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

/**
 * Generates flashcards for a given topic using serverless function.
 * @param topic - The user-provided topic.
 * @returns A promise that resolves to an array of Flashcard objects.
 */
export async function generateFlashcards(topic: string): Promise<Flashcard[]> {
  console.log('🤖 Generating flashcards with serverless Gemini API...');
  
  const { currentLanguage, contentDetail } = getState();

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
        contentDetail: contentDetail
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Handle rate limiting
      if (response.status === 429) {
        showUsageNotification(
          error.message || 'Daily free limit exceeded. Try again tomorrow or deploy your own version!',
          'warning'
        );
      }
      
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Show usage info if available
    if (result.usage) {
      showUsageNotification(
        `Free usage: ${result.usage.remaining}/${result.usage.limit} remaining today`,
        'info'
      );
    }
    
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
      
      // Handle rate limiting
      if (response.status === 429) {
        showUsageNotification(
          error.message || 'Daily free limit exceeded. Try again tomorrow!',
          'warning'
        );
      }
      
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Show usage info if available
    if (result.usage) {
      showUsageNotification(
        `Free usage: ${result.usage.remaining}/${result.usage.limit} remaining today`,
        'info'
      );
    }
    
    console.log('✅ Chat response generated successfully with serverless API!');
    
    return result.data || 'I couldn\'t generate a response. Please try again.';
    
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}