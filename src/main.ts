/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { setupEventListeners } from './ui';
import { setLanguage, startPlaceholderAnimation } from './i18n';
import { topicInput } from './dom';

/**
 * Initializes the application.
 * This function is the main entry point.
 */
function main() {
  setupEventListeners();
  setLanguage('en');
  topicInput.focus();
  startPlaceholderAnimation();
}

// Run the main function once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', main);