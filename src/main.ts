/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { setupEventListeners } from './ui';
import { setLanguage, startPlaceholderAnimation } from './i18n';
import { topicInput } from './dom';
import { initGoogleAuth } from './google-auth';

/**
 * Initializes the application.
 * This function is the main entry point.
 */
function main() {
  setupEventListeners();
  setLanguage('en');
  topicInput.focus();
  startPlaceholderAnimation();
  
  // Initialize Google Authentication
  initGoogleAuth();
}

// Run the main function once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', main);