/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { setupEventListeners } from './ui';
import { setLanguage, startPlaceholderAnimation } from './i18n';
import { topicInput } from './dom';
import { initGoogleAuth } from './google-auth';
import type { Language } from './types';

/**
 * Detects browser language and sets appropriate app language
 */
function detectAndSetBrowserLanguage() {
  // Get browser language
  const browserLang = navigator.language || navigator.languages[0];
  let langCode: Language = 'en'; // default

  if (browserLang.startsWith('ko')) {
    langCode = 'ko';
  } else if (browserLang.startsWith('ja')) {
    langCode = 'ja';
  } else if (browserLang.startsWith('de')) {
    langCode = 'de';
  } else if (browserLang.startsWith('it')) {
    langCode = 'it';
  } else if (browserLang.startsWith('no')) {
    langCode = 'no';
  }

  setLanguage(langCode);
  console.log(`🌐 Auto-detected language: ${langCode} (from browser: ${browserLang})`);
}

/**
 * Initializes the application.
 * This function is the main entry point.
 */
function main() {
  setupEventListeners();
  
  // Auto-detect and set browser language
  detectAndSetBrowserLanguage();
  
  topicInput.focus();
  startPlaceholderAnimation();
  
  // Initialize Google Authentication
  initGoogleAuth();
}

// Run the main function once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', main);