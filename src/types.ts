/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents the core data for a single flashcard.
 * This is the structure expected from the AI API.
 */
export interface Flashcard {
  term: string;
  definition: string;
  importance: number;
}

/**
 * Represents a flashcard node within the physics simulation.
 * It extends the base Flashcard with properties for position, velocity,
 * size, and its corresponding DOM element.
 */
export interface CardNode extends Flashcard {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  element: HTMLDivElement;
  isExpanded: boolean;
  isDragging?: boolean;  // For mouse drag interaction
}

/**
 * Represents a single state in the user's exploration history for breadcrumbs.
 */
export interface HistoryState {
  topic: string;
  nodes: CardNode[];
}

/**
 * Defines the supported languages for the application.
 */
export type Language = 'en' | 'ja' | 'ko' | 'de' | 'it' | 'no';

/**
 * Represents a dictionary of translation strings for a given language.
 */
export type Translations = Record<string, string>;

/**
 * Represents a Google authenticated user.
 */
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  locale?: string;
  apiKey?: string; // User's personal Gemini API key
}

/**
 * Google Sign-In API types
 */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          disableAutoSelect: () => void;
        };
      };
    };
    // Auth functions made globally available
    signOut?: () => void;
    showGoogleSignIn?: () => void;
  }
}