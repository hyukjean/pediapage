/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Language, Translations } from './types';
import { getState, setState } from './state';
import { resetApp } from './ui';
import * as dom from './dom';
import { PLACEHOLDER_INTERVAL_MS } from './constants';

// --- I18N TRANSLATIONS ---
const translations: Record<Language, Translations> = {
  en: {
    modalTitle: 'Generate New Topic',
    placeholder: 'e.g., Explain the fall of the Roman Empire',
    generateButton: 'Generate',
    detailBasic: 'Basic',
    detailDetailed: 'Detailed',
    errorTopic: 'Please enter a topic.',
    errorGenerating: 'Generating cards...',
    errorNoCards: 'No valid flashcards could be generated. Please try a different topic.',
    errorEmptyResponse: 'Failed to generate flashcards or received an empty response. Please try again.',
    errorUnknown: 'An error occurred: ',
    generating: 'Creating cards...',
    home: 'Home',
    chatTitle: 'Chat with Selected Cards',
    selectedCards: 'Selected Cards:',
    askButton: 'Ask Question',
    generateFromSelection: 'Create Cards from Selection',
    backToGeneration: '← Back to Generation',
    errorQuestion: 'Please enter a question',
    errorNoCardsSelected: 'Please select some cards first',
    maxCardsSelected: 'Maximum 5 cards can be selected',
    thinking: 'Thinking...',
  },
  ja: {
    modalTitle: '新しいトピックを生成',
    placeholder: '例：ローマ帝国の崩壊を説明してください',
    generateButton: '生成する',
    cardsLabel: 'カードの枚数：',
    detailBasic: '基本',
    detailDetailed: '詳細',
    countAuto: '自動',
    countCustom: 'カスタム',
    errorTopic: 'トピックを入力してください。',
    errorGenerating: 'カードを生成しています...',
    errorNoCards: '有効なフラッシュカードを生成できませんでした。別のトピックをお試しください。',
    errorEmptyResponse: 'フラッシュカードの生成に失敗したか、空の応答を受信しました。もう一度お試しください。',
    errorUnknown: 'エラーが発生しました：',
    generating: 'カードを作成しています...',
    home: 'ホーム',
  },
  ko: {
    modalTitle: '새 주제 생성',
    placeholder: '예: 로마 제국의 멸망을 설명하시오',
    generateButton: '생성하기',
    detailBasic: '기본',
    detailDetailed: '상세',
    errorTopic: '주제를 입력하세요.',
    errorGenerating: '카드를 생성하는 중...',
    errorNoCards: '유효한 플래시카드를 생성할 수 없습니다. 다른 주제를 시도해 보세요.',
    errorEmptyResponse: '플래시카드를 생성하지 못했거나 빈 응답을 받았습니다. 다시 시도해 주세요.',
    errorUnknown: '오류가 발생했습니다: ',
    generating: '카드를 생성 중입니다...',
    home: '홈',
    chatTitle: '선택된 카드와 대화',
    selectedCards: '선택된 카드:',
    askButton: '질문하기',
    generateFromSelection: '선택된 카드로 새 카드 생성',
    backToGeneration: '← 생성 모드로 돌아가기',
    errorQuestion: '질문을 입력해주세요',
    errorNoCardsSelected: '먼저 카드를 선택해주세요',
    maxCardsSelected: '최대 5개의 카드까지 선택 가능합니다',
    thinking: '생각 중...',
  },
  de: {
    modalTitle: 'Neues Thema generieren',
    placeholder: 'z.B. Erklären Sie den Untergang des Römischen Reiches',
    generateButton: 'Generieren',
    cardsLabel: 'Anzahl der Karten:',
    detailBasic: 'Grundlegend',
    detailDetailed: 'Detailliert',
    countAuto: 'Auto',
    countCustom: 'Benutzerdef.',
    errorTopic: 'Bitte geben Sie ein Thema ein.',
    errorGenerating: 'Karten werden generiert...',
    errorNoCards: 'Es konnten keine gültigen Lernkarten generiert werden. Bitte versuchen Sie ein anderes Thema.',
    errorEmptyResponse: 'Fehler beim Generieren der Lernkarten oder leere Antwort erhalten. Bitte versuchen Sie es erneut.',
    errorUnknown: 'Ein Fehler ist aufgetreten: ',
    generating: 'Karten werden erstellt...',
    home: 'Startseite',
  },
  it: {
    modalTitle: 'Genera Nuovo Argomento',
    placeholder: 'es. Spiega la caduta dell\'Impero Romano',
    generateButton: 'Genera',
    cardsLabel: 'Numero di Carte:',
    detailBasic: 'Base',
    detailDetailed: 'Dettagliato',
    countAuto: 'Auto',
    countCustom: 'Personalizza',
    errorTopic: 'Inserisci un argomento.',
    errorGenerating: 'Generazione delle carte in corso...',
    errorNoCards: 'Impossibile generare flashcard valide. Prova un argomento diverso.',
    errorEmptyResponse: 'Impossibile generare flashcard o risposta vuota ricevuta. Riprova.',
    errorUnknown: 'Si è verificato un errore: ',
    generating: 'Creazione delle carte in corso...',
    home: 'Home',
  },
  no: {
    modalTitle: 'Generer Nytt Emne',
    placeholder: 'f.eks. Forklar Romerrikets fall',
    generateButton: 'Generer',
    cardsLabel: 'Antall Kort:',
    detailBasic: 'Grunnleggende',
    detailDetailed: 'Detaljert',
    countAuto: 'Auto',
    countCustom: 'Tilpasset',
    errorTopic: 'Vennligst skriv inn et emne.',
    errorGenerating: 'Genererer kort...',
    errorNoCards: 'Kunne ikke generere gyldige flashkort. Prøv et annet emne.',
    errorEmptyResponse: 'Kunne ikke generere flashkort eller mottok tomt svar. Vennligst prøv igjen.',
    errorUnknown: 'En feil oppstod: ',
    generating: 'Lager kort...',
    home: 'Hjem',
  },
};

const placeholderExamples: Record<Language, string[]> = {
  en: ['Explain the process of photosynthesis', 'What are the core principles of Stoicism?', 'Summarize the plot of Hamlet', 'How does a blockchain work?'],
  ja: ['光合成のプロセスを説明してください', 'ストア派の核となる原則は何ですか？', 'ハムレットのあらすじを要約してください', 'ブロックチェーンはどのように機能しますか？'],
  ko: ['광합성 과정을 설명해주세요', '스토아학파의 핵심 원칙은 무엇인가요?', '햄릿의 줄거리를 요약해주세요', '블록체인은 어떻게 작동하나나요?'],
  de: ['Erklären Sie den Prozess der Photosynthese', 'Was sind die Grundprinzipien des Stoizismus?', 'Fassen Sie die Handlung von Hamlet zusammen', 'Wie funktioniert eine Blockchain?'],
  it: ['Spiega il processo della fotosintesi', 'Quali sono i principi fondamentali dello Stoicismo?', 'Riassumi la trama di Amleto', 'Come funziona una blockchain?'],
  no: ['Forklar prosessen med fotosyntese', 'Hva er kjerneprinsippene i stoisismen?', 'Oppsummer handlingen i Hamlet', 'Hvordan fungerer en blokkjede?'],
};

export const getCurrentTranslations = (): Translations => {
  return translations[getState().currentLanguage];
};

/**
 * Updates all UI text based on the current language.
 */
export const setLanguage = (lang: Language) => {
  setState({ currentLanguage: lang });
  document.documentElement.lang = lang;
  const translation = translations[lang];
  document.querySelectorAll('[data-translate-key]').forEach((el) => {
    const key = el.getAttribute('data-translate-key');
    if (key && translation[key]) {
      el.textContent = translation[key];
    }
  });

  resetApp();
};

/**
 * Starts the dynamic placeholder animation for the topic input.
 */
export const startPlaceholderAnimation = () => {
  const state = getState();
  clearInterval(state.placeholderInterval);
  const examples = placeholderExamples[state.currentLanguage];
  let currentExampleIndex = 0;

  const animate = () => {
    if (document.activeElement === dom.topicInput || dom.topicInput.value !== '') {
        dom.topicInput.placeholder = translations[getState().currentLanguage]['placeholder'];
        return;
    }
    dom.topicInput.placeholder = examples[currentExampleIndex];
    currentExampleIndex = (currentExampleIndex + 1) % examples.length;
  };

  animate();
  const intervalId = window.setInterval(animate, PLACEHOLDER_INTERVAL_MS);
  setState({ placeholderInterval: intervalId });
};