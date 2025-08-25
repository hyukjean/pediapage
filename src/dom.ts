/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This file centralizes all DOM element selections for easy access and management.

export const topicInput = document.getElementById('topicInput') as HTMLTextAreaElement;
export const generateButton = document.getElementById('generateButton') as HTMLButtonElement;
export const flashcardsContainer = document.getElementById('flashcardsContainer') as HTMLDivElement;
export const errorMessage = document.getElementById('errorMessage') as HTMLDivElement;
export const chatbotWindow = document.getElementById('chatbotWindow') as HTMLDivElement;
export const cardCountSlider = document.getElementById('cardCountSlider') as HTMLInputElement;
export const cardCountLabel = document.getElementById('cardCountLabel') as HTMLSpanElement;
export const languageSelectorButton = document.getElementById('languageSelectorButton') as HTMLButtonElement;
export const languageDropdown = document.getElementById('languageDropdown') as HTMLUListElement;
export const detailOptions = document.querySelectorAll('.detail-option[data-detail]') as NodeListOf<HTMLButtonElement>;
export const cardCountOptions = document.querySelectorAll('.detail-option[data-count]') as NodeListOf<HTMLButtonElement>;
export const customCountContainer = document.getElementById('customCountContainer') as HTMLDivElement;
export const loader = document.getElementById('loader') as HTMLDivElement;
export const generationControls = document.getElementById('generationControls') as HTMLDivElement;
export const breadcrumbNav = document.getElementById('breadcrumbNav') as HTMLElement;
export const logo = document.getElementById('logo') as HTMLElement;

// Chat interface elements
export const chatInterface = document.getElementById('chatInterface') as HTMLDivElement;
export const selectedCardsList = document.getElementById('selectedCardsList') as HTMLDivElement;
export const chatInput = document.getElementById('chatInput') as HTMLTextAreaElement;
export const askButton = document.getElementById('askButton') as HTMLButtonElement;
export const generateFromSelectionButton = document.getElementById('generateFromSelectionButton') as HTMLButtonElement;
export const backToGenerationButton = document.getElementById('backToGenerationButton') as HTMLButtonElement;
export const chatResponse = document.getElementById('chatResponse') as HTMLDivElement;
export const modalTitle = document.getElementById('modalTitle') as HTMLHeadingElement;