/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from './dom';
import { getState, setState } from './state';
import { generateFlashcards, generateChatResponse } from './api';
import { createCardNodes, stopSimulation, toggleNodeExpansion } from './physics';
import { setLanguage, getCurrentTranslations, startPlaceholderAnimation } from './i18n';
import type { Language, CardNode } from './types';

/**
 * Initialize authentication UI
 */
export const initializeAuthUI = () => {
  const { currentUser } = getState();
  
  if (currentUser) {
    // User is signed in, update UI accordingly
    updateUIForSignedInUser(currentUser);
  } else {
    // User is not signed in, show sign-in button
    updateUIForSignedOutUser();
  }
};

/**
 * Update UI for signed-in user
 */
const updateUIForSignedInUser = (user: any) => {
  // Remove any existing auth UI
  const existingUserInfo = document.querySelector('.user-info');
  const existingSignInBtn = document.querySelector('.sign-in-btn');
  if (existingUserInfo) existingUserInfo.remove();
  if (existingSignInBtn) existingSignInBtn.remove();

  const header = document.querySelector('header');
  if (header) {
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `
      <div class="user-avatar" title="로그아웃">
        <img src="${user.picture}" alt="${user.name}">
        ${user.apiKey ? '<div class="api-connected" title="개인 API 사용중"></div>' : '<div class="api-demo" title="데모 API 사용중"></div>'}
      </div>
    `;
    
    userInfo.onclick = () => window.signOut?.();

    // Insert before language selector
    const languageSelector = header.querySelector('.language-selector');
    if (languageSelector) {
      header.insertBefore(userInfo, languageSelector);
    }
  }
};

/**
 * Update authentication UI based on current state
 */
export const updateAuthUI = () => {
  const { currentUser } = getState();
  
  if (currentUser) {
    updateUIForSignedInUser(currentUser);
  } else {
    updateUIForSignedOutUser();
  }
};

/**
 * Update UI for signed-out user
 */
const updateUIForSignedOutUser = () => {
  // Remove any existing auth UI
  const existingUserInfo = document.querySelector('.user-info');
  const existingSignInBtn = document.querySelector('.sign-in-btn');
  if (existingUserInfo) existingUserInfo.remove();
  if (existingSignInBtn) existingSignInBtn.remove();

  const header = document.querySelector('header');
  if (header) {
    const signInBtn = document.createElement('button');
    signInBtn.className = 'sign-in-btn';
    signInBtn.title = '로그인해서 제미니를 연결해 무제한 검색하세요';
    signInBtn.innerHTML = `
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#EA4335" d="m24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
    `;
    signInBtn.onclick = () => window.showGoogleSignIn?.();
    
    const languageSelector = header.querySelector('.language-selector');
    if (languageSelector) {
      header.insertBefore(signInBtn, languageSelector);
    }
  }
};

/** Switches the UI from initial centered view to the main app view */
const activateAppView = () => {
    const { isInitialView } = getState();
    if (isInitialView) {
        setState({ isInitialView: false });
        document.body.classList.add('app-active');
    }
};

/** Toggles between generation mode and chat mode */
const toggleChatMode = (showChat: boolean) => {
    setState({ showChatMode: showChat });
    
    if (showChat) {
        dom.generationControls.classList.add('hidden');
        dom.chatInterface.classList.remove('hidden');
        dom.modalTitle.textContent = getCurrentTranslations()['chatTitle'] || 'Chat with Selected Cards';
        updateSelectedCardsDisplay();
    } else {
        dom.chatInterface.classList.add('hidden');
        dom.generationControls.classList.remove('hidden');
        dom.modalTitle.textContent = getCurrentTranslations()['modalTitle'] || 'Generate New Cards';
        dom.chatResponse.classList.add('hidden');
        // Clear selection when leaving chat mode
        const { selectedCards } = getState();
        selectedCards.forEach(card => {
            card.element.classList.remove('selected');
        });
        setState({ selectedCards: [] });
    }
};

/** Updates the display of selected cards in chat mode */
const updateSelectedCardsDisplay = () => {
    const { selectedCards } = getState();
    dom.selectedCardsList.innerHTML = '';
    
    selectedCards.forEach(card => {
        const cardTag = document.createElement('div');
        cardTag.className = 'selected-card-tag';
        cardTag.innerHTML = `
            <span>${card.term}</span>
            <button class="remove-card" data-card-id="${card.id}">×</button>
        `;
        dom.selectedCardsList.appendChild(cardTag);
    });
    
    // Update chat input placeholder
    if (selectedCards.length > 0) {
        dom.chatInput.placeholder = `Ask something about: ${selectedCards.map(c => c.term).join(', ')}...`;
    } else {
        dom.chatInput.placeholder = 'Select some cards first by clicking the + button...';
    }
};

/** Handles card selection/deselection */
const toggleCardSelection = (card: CardNode) => {
    let { selectedCards } = getState();
    const isSelected = selectedCards.some(c => c.id === card.id);
    
    if (isSelected) {
        // Deselect card
        selectedCards = selectedCards.filter(c => c.id !== card.id);
        card.element.classList.remove('selected');
    } else {
        // Select card (limit to 5 cards for better chat experience)
        if (selectedCards.length < 5) {
            selectedCards = [...selectedCards, card];
            card.element.classList.add('selected');
        } else {
            const translations = getCurrentTranslations();
            dom.errorMessage.textContent = translations['maxCardsSelected'] || 'Maximum 5 cards can be selected';
            setTimeout(() => dom.errorMessage.textContent = '', 3000);
            return;
        }
    }
    
    setState({ selectedCards });
    
    // If we have selected cards, switch to chat mode
    if (selectedCards.length > 0 && !getState().showChatMode) {
        toggleChatMode(true);
    } else if (selectedCards.length === 0 && getState().showChatMode) {
        toggleChatMode(false);
    }
    
    updateSelectedCardsDisplay();
};

/** Toggles the loader visibility */
const showLoader = (show: boolean) => {
    dom.loader.classList.toggle('hidden', !show);
    // Also disable the generate button to prevent multiple requests
    dom.generateButton.disabled = show;
};

/** Renders the breadcrumb navigation */
const renderBreadcrumbs = () => {
    const { historyStack, currentLanguage } = getState();
    const translations = getCurrentTranslations();

    if (historyStack.length === 0) {
        dom.breadcrumbNav.classList.add('hidden');
        return;
    }
    dom.breadcrumbNav.innerHTML = '';
    
    const homeLink = document.createElement('a');
    homeLink.textContent = translations['home'] || 'Home';
    homeLink.className = 'breadcrumb-item link';
    homeLink.onclick = () => resetApp();
    dom.breadcrumbNav.appendChild(homeLink);

    historyStack.forEach((state, index) => {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = '>';
        dom.breadcrumbNav.appendChild(separator);

        if (index < historyStack.length - 1) {
            const link = document.createElement('a');
            link.textContent = state.topic;
            link.className = 'breadcrumb-item link';
            link.onclick = () => navigateBack(index);
            dom.breadcrumbNav.appendChild(link);
        } else {
            const current = document.createElement('span');
            current.textContent = state.topic;
            current.className = 'breadcrumb-item';
            dom.breadcrumbNav.appendChild(current);
        }
    });
    dom.breadcrumbNav.classList.remove('hidden');
};

const navigateBack = (index: number) => {
    let { historyStack } = getState();
    const targetState = historyStack[index];
    historyStack = historyStack.slice(0, index + 1);
    setState({ historyStack });
    createCardNodes(targetState.nodes);
    renderBreadcrumbs();
};

/** Generates chat response based on selected cards and user question */
const handleChatQuestion = async () => {
    const { selectedCards } = getState();
    const question = dom.chatInput.value.trim();
    const translations = getCurrentTranslations();
    
    if (!question) {
        dom.errorMessage.textContent = translations['errorQuestion'] || 'Please enter a question';
        return;
    }
    
    if (selectedCards.length === 0) {
        dom.errorMessage.textContent = translations['errorNoCardsSelected'] || 'Please select some cards first';
        return;
    }
    
    // Show loading state
    dom.askButton.disabled = true;
    dom.askButton.textContent = translations['thinking'] || 'Thinking...';
    dom.chatResponse.classList.add('hidden');
    dom.errorMessage.textContent = '';
    
    try {
        const selectedTerms = selectedCards.map(card => card.term);
        const response = await generateChatResponse(selectedTerms, question);
        
        // Display response in a card-like format
        dom.chatResponse.innerHTML = `
            <div class="chat-response-card">
                <div class="chat-response-header">
                    <h4>💬 AI Response</h4>
                    <div class="response-context">About: ${selectedTerms.join(', ')}</div>
                </div>
                <div class="chat-response-content">${response}</div>
                <div class="chat-response-question">
                    <strong>Q:</strong> ${question}
                </div>
            </div>
        `;
        dom.chatResponse.classList.remove('hidden');
        
        // Clear input
        dom.chatInput.value = '';
        
    } catch (error) {
        console.error('Error generating chat response:', error);
        dom.errorMessage.textContent = `${translations['errorUnknown'] || 'Error: '}${(error as Error)?.message || ''}`;
    } finally {
        dom.askButton.disabled = false;
        dom.askButton.textContent = translations['askButton'] || 'Ask Question';
    }
};

/** Generates new flashcards from selected cards */
const generateFromSelectedCards = async () => {
    const { selectedCards } = getState();
    const translations = getCurrentTranslations();
    
    if (selectedCards.length === 0) {
        dom.errorMessage.textContent = translations['errorNoCardsSelected'] || 'Please select some cards first';
        return;
    }
    
    const combinedTopic = selectedCards.map(card => card.term).join(' + ');
    
    // Switch back to generation mode temporarily
    toggleChatMode(false);
    
    // Generate new cards
    await generateNewTopic(combinedTopic, true);
};
/** Resets the application to its initial state */
export const resetApp = () => {
    stopSimulation();
    setState({
        isInitialView: true,
        historyStack: [],
        cardNodes: [],
        selectedCards: [],
        showChatMode: false,
    });
    dom.flashcardsContainer.innerHTML = '';
    dom.topicInput.value = '';
    document.body.classList.remove('app-active');
    renderBreadcrumbs();
    dom.chatbotWindow.classList.remove('hidden');
    toggleChatMode(false); // Ensure we're in generation mode
    startPlaceholderAnimation();
    dom.topicInput.focus();
};


/** Fetches cards for a new topic and updates the UI */
const generateNewTopic = async (topic: string, isDrillDown: boolean = false) => {
    const translations = getCurrentTranslations();
    if (!topic) {
        dom.errorMessage.textContent = translations['errorTopic'];
        return;
    }
    
    let { historyStack, cardNodes } = getState();
    if (!isDrillDown && cardNodes.length > 0) {
      // This case is unlikely now but good for safety: starting a new topic from the input
      historyStack = []; 
    }

    showLoader(true);
    dom.errorMessage.textContent = '';

    try {
        const newFlashcards = await generateFlashcards(topic);

        if (newFlashcards.length > 0) {
            activateAppView();
            // Cast is ok here, as createCardNodes will hydrate them into full CardNode objects
            const newNodes = newFlashcards as CardNode[]; 
            historyStack.push({ topic: topic, nodes: newNodes });
            setState({ historyStack });
            renderBreadcrumbs();
            createCardNodes(newFlashcards);
            dom.topicInput.value = '';
        } else {
            dom.errorMessage.textContent = translations['errorNoCards'];
        }
    } catch (error) {
        console.error('Error generating content:', error);
        dom.errorMessage.textContent = `${translations['errorUnknown']}${(error as Error)?.message || ''}`;
    } finally {
        showLoader(false);
    }
};


/** Sets up all the event listeners for the application */
export const setupEventListeners = () => {
    dom.generateButton.addEventListener('click', () => generateNewTopic(dom.topicInput.value.trim()));
    dom.logo.addEventListener('click', resetApp);
    
    // Enter key support for topic input
    dom.topicInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const topic = dom.topicInput.value.trim();
            if (topic) {
                generateNewTopic(topic);
            }
        }
    });
    
    dom.languageSelectorButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.languageDropdown.classList.toggle('hidden');
    });

    dom.languageDropdown.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'LI') {
        const lang = target.dataset.lang as Language;
        if (lang) {
          setLanguage(lang);
          dom.languageDropdown.classList.add('hidden');
        }
      }
    });

    document.addEventListener('click', () => {
        if(!dom.languageDropdown.classList.contains('hidden')) {
            dom.languageDropdown.classList.add('hidden');
        }
    });

    dom.detailOptions.forEach(option => {
        option.addEventListener('click', () => {
            dom.detailOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            setState({ contentDetail: option.dataset.detail as 'basic' | 'detailed' });
        });
    });

    // Event delegation for card interactions
    dom.flashcardsContainer.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const cardElement = target.closest<HTMLElement>('.flashcard');
        
        // Click on background to deselect all
        if (e.target === dom.flashcardsContainer) {
            getState().cardNodes.forEach(node => {
                if (node.isExpanded) {
                    node.isExpanded = false;
                    node.element.classList.remove('expanded');
                }
            });
            return;
        }

        if (!cardElement) return;

        // Click on drill-down button (now for card selection)
        if (target.closest('.drill-down-button')) {
            e.stopPropagation();
            const nodeId = parseInt(cardElement.dataset.nodeId || '-1');
            const sourceNode = getState().cardNodes.find(n => n.id === nodeId);
            if (sourceNode) {
                toggleCardSelection(sourceNode);
            }
            return;
        }

        // Click on card to expand/collapse
        const nodeId = parseInt(cardElement.dataset.nodeId || '-1');
        const node = getState().cardNodes.find(n => n.id === nodeId);
        if(node) toggleNodeExpansion(node);
    });

    // Chat interface event listeners
    dom.askButton.addEventListener('click', handleChatQuestion);
    dom.generateFromSelectionButton.addEventListener('click', generateFromSelectedCards);
    dom.backToGenerationButton.addEventListener('click', () => toggleChatMode(false));
    
    // Handle removing cards from selection
    dom.selectedCardsList.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('remove-card')) {
            const cardId = parseInt(target.dataset.cardId || '-1');
            const { selectedCards, cardNodes } = getState();
            const cardToRemove = cardNodes.find(c => c.id === cardId);
            if (cardToRemove) {
                toggleCardSelection(cardToRemove);
            }
        }
    });
    
    // Handle Enter key in chat input
    dom.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatQuestion();
        }
    });
};