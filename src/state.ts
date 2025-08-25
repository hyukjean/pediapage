/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CardNode, Language, HistoryState } from './types';

// The single source of truth for the application's state.
const appState = {
  cardNodes: [] as CardNode[],
  currentLanguage: 'en' as Language,
  placeholderInterval: 0,
  isInitialView: true,
  contentDetail: 'basic' as 'basic' | 'detailed',
  cardCountMode: 'auto' as 'auto' | 'custom',
  animationFrameId: null as number | null,
  historyStack: [] as HistoryState[],
  selectedCards: [] as CardNode[], // For multi-card selection and chat
  showChatMode: false, // Whether to show chat interface instead of generation
};

// Type definition for the state object to be used with the setter.
export type AppState = typeof appState;

/**
 * Retrieves a read-only snapshot of the current application state.
 * @returns The current state.
 */
export const getState = (): Readonly<AppState> => {
  return appState;
};

/**
 * Updates the application state by merging the new state with the existing state.
 * @param newState - An object containing the state properties to update.
 */
export const setState = (newState: Partial<AppState>) => {
  Object.assign(appState, newState);
};