/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { setupEventListeners, initializeAuthUI } from './ui';
import { initializeLanguage, startPlaceholderAnimation } from './i18n';
import { initializeGoogleAuth } from './auth';
import { topicInput } from './dom';

/**
 * Initializes the application.
 * This function is the main entry point.
 */
async function main() {
  setupEventListeners();
  
  // Initialize language (with browser detection)
  initializeLanguage();
  
  // Initialize authentication UI
  initializeAuthUI();
  
  // Initialize Google Sign-In
  try {
    await initializeGoogleAuth();
    console.log('✅ Google Auth initialized');
  } catch (error) {
    console.warn('⚠️  Google Auth initialization failed:', error);
  }
  
  topicInput.focus();
  startPlaceholderAnimation();
}

// Run the main function once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', main);