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
    dom.generationControls.classList.toggle('hidden', show);
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
    dom.generateButton.disabled = true;

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
        dom.generateButton.disabled = false;
        showLoader(false);
    }
};


/** Sets up all the event listeners for the application */
export const setupEventListeners = () => {
    dom.generateButton.addEventListener('click', () => generateNewTopic(dom.topicInput.value.trim()));
    dom.logo.addEventListener('click', resetApp);

    dom.cardCountSlider.addEventListener('input', () => {
      dom.cardCountLabel.textContent = dom.cardCountSlider.value;
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

    dom.cardCountOptions.forEach(option => {
        option.addEventListener('click', () => {
            dom.cardCountOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            const cardCountMode = option.dataset.count as 'auto' | 'custom';
            setState({ cardCountMode });
            dom.customCountContainer.classList.toggle('hidden', cardCountMode === 'auto');
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

    // Set initial label value
    dom.cardCountLabel.textContent = dom.cardCountSlider.value;

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