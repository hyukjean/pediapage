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
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.99,12.15C22,11.45,21.95,10.76,21.85,10.08H12.21V14.2H17.75C17.5,15.66,16.57,16.86,15.15,17.75V20.2H18.4C20.6,18.2,21.99,15.45,21.99,12.15Z" fill="#4285F4"/>
        <path d="M12.21,22C15.23,22,17.76,21.03,19.5,19.43L16.2,17.15C15.21,17.83,13.83,18.25,12.21,18.25C9.3,18.25,6.8,16.35,5.95,13.85H2.58V16.3C4.3,19.75,7.93,22,12.21,22Z" fill="#34A853"/>
        <path d="M5.95,13.85C5.7,13.18,5.58,12.45,5.58,11.7C5.58,10.95,5.7,10.22,5.95,9.55V7.1H2.58C1.9,8.43,1.5,10,1.5,11.7C1.5,13.4,1.9,14.97,2.58,16.3L5.95,13.85Z" fill="#FBBC05"/>
        <path d="M12.21,5.15C13.95,5.15,15.38,5.75,16.45,6.75L19.58,3.63C17.75,1.98,15.23,1,12.21,1C7.93,1,4.3,3.25,2.58,6.7L5.95,9.15C6.8,6.65,9.3,4.75,12.21,4.75Z" fill="#EA4335"/>
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