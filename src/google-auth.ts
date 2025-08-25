// Google OAuth integration for automatic API key connection
import { setLanguage } from './i18n.js';
import { getState } from './state.js';
import type { Language } from './types.js';

interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface GoogleAuthResponse {
  credential: string;
  select_by: string;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
    handleCredentialResponse: (response: GoogleAuthResponse) => void;
  }
}

let currentUser: GoogleUser | null = null;
let userApiKey: string | null = null;

// Simple notification system
function showSimpleNotification(message: string): void {
  const notification = document.createElement('div');
  notification.className = 'simple-notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 100);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

export function initGoogleAuth(): void {
  // Load Google Identity Services
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  script.onload = () => {
    window.google.accounts.id.initialize({
      client_id: 'YOUR_GOOGLE_CLIENT_ID', // This will need to be configured
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });

    setupGoogleLoginButton();
  };
}

function setupGoogleLoginButton(): void {
  const languageSelector = document.querySelector('.language-selector');
  if (!languageSelector) return;

  // Create Google login button
  const googleLoginButton = document.createElement('button');
  googleLoginButton.id = 'googleLoginButton';
  googleLoginButton.className = 'google-login-button';
  googleLoginButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  `;
  googleLoginButton.setAttribute('aria-label', 'Google Login');
  googleLoginButton.setAttribute('title', '로그인해서 제미니로 무제한 생성');

  // Add click handler
  googleLoginButton.addEventListener('click', () => {
    window.google.accounts.id.prompt();
  });

  // Insert before language selector
  languageSelector.parentNode?.insertBefore(googleLoginButton, languageSelector);

  // Create tooltip
  createTooltip(googleLoginButton);
}

function createTooltip(button: HTMLElement): void {
  const tooltip = document.createElement('div');
  tooltip.className = 'google-login-tooltip';
  tooltip.textContent = '로그인해서 제미니로 무제한 생성';
  document.body.appendChild(tooltip);

  button.addEventListener('mouseenter', (e) => {
    const rect = button.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.bottom + 8}px`;
    tooltip.classList.add('visible');
  });

  button.addEventListener('mouseleave', () => {
    tooltip.classList.remove('visible');
  });
}

function handleCredentialResponse(response: GoogleAuthResponse): void {
  try {
    // Decode JWT token to get user info
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    
    currentUser = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture
    };

    // Auto-detect browser language
    detectAndSetLanguage();

    // Show login success
    showSimpleNotification('Google 로그인 성공! 제미니 API가 자동으로 연결됩니다.');

    // Update UI
    updateLoginButton();

    // Generate or retrieve user's API key
    generateUserApiKey();

  } catch (error) {
    console.error('Login failed:', error);
    showSimpleNotification('로그인에 실패했습니다. 다시 시도해주세요.');
  }
}

function detectAndSetLanguage(): void {
  // Get browser language
  const browserLang = navigator.language || navigator.languages[0];
  let langCode: Language = 'en'; // default

  if (browserLang.startsWith('ko')) {
    langCode = 'ko';
  } else if (browserLang.startsWith('ja')) {
    langCode = 'ja';
  } else if (browserLang.startsWith('de')) {
    langCode = 'de';
  } else if (browserLang.startsWith('it')) {
    langCode = 'it';
  } else if (browserLang.startsWith('no')) {
    langCode = 'no';
  }

  // Only set if different from current
  const currentLanguage = getState().currentLanguage;
  if (currentLanguage !== langCode) {
    setLanguage(langCode);
    showSimpleNotification(`언어가 ${langCode.toUpperCase()}로 자동 설정되었습니다.`);
  }
}

function updateLoginButton(): void {
  const button = document.getElementById('googleLoginButton');
  if (!button || !currentUser) return;

  // Update button to show user avatar or initial
  button.innerHTML = currentUser.picture 
    ? `<img src="${currentUser.picture}" alt="${currentUser.name}" style="width: 24px; height: 24px; border-radius: 50%;">`
    : `<div class="user-initial">${currentUser.name.charAt(0).toUpperCase()}</div>`;

  button.setAttribute('title', `${currentUser.name}으로 로그인됨 - 무제한 생성 가능`);
  
  // Add logout functionality
  button.addEventListener('click', handleLogout);
}

function handleLogout(): void {
  currentUser = null;
  userApiKey = null;

  // Reset button
  const button = document.getElementById('googleLoginButton');
  if (button) {
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    `;
    button.setAttribute('title', '로그인해서 제미니로 무제한 생성');
    button.removeEventListener('click', handleLogout);
    button.addEventListener('click', () => window.google.accounts.id.prompt());
  }

  showSimpleNotification('로그아웃되었습니다.');
}

function generateUserApiKey(): void {
  // In a real implementation, this would:
  // 1. Call your backend to generate a user-specific API key
  // 2. Or use the user's own Gemini API key if they have one
  // 3. Store it securely for this session
  
  // For now, simulate getting unlimited access
  userApiKey = `user_${currentUser?.id}_unlimited_key`;
  
  // Store in sessionStorage for this session
  sessionStorage.setItem('userApiKey', userApiKey);
  sessionStorage.setItem('isLoggedIn', 'true');
  sessionStorage.setItem('userData', JSON.stringify(currentUser));
}

export function getUserApiKey(): string | null {
  if (userApiKey) return userApiKey;
  
  // Check session storage
  const stored = sessionStorage.getItem('userApiKey');
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  
  if (stored && isLoggedIn) {
    userApiKey = stored;
    return userApiKey;
  }
  
  return null;
}

export function isUserLoggedIn(): boolean {
  return currentUser !== null || sessionStorage.getItem('isLoggedIn') === 'true';
}

export function getCurrentUser(): GoogleUser | null {
  if (currentUser) return currentUser;
  
  const stored = sessionStorage.getItem('userData');
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      return currentUser;
    } catch {
      return null;
    }
  }
  
  return null;
}

// Window global function for Google callback
window.handleCredentialResponse = handleCredentialResponse;
