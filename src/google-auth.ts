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

// Demo login function for testing without OAuth setup
function simulateDemoLogin(): void {
  console.log('🧪 Starting demo login process...');
  
  // Create a demo user
  currentUser = {
    id: 'demo_user_123',
    name: 'Demo User',
    email: 'demo@pedia.page',
    picture: ''
  };

  console.log('👤 Demo user created:', currentUser);

  // Reset usage limits for demo mode
  sessionStorage.removeItem('usageCount');
  sessionStorage.removeItem('lastUsageReset');
  console.log('🔄 Usage limits reset for demo mode');

  // Auto-detect browser language
  detectAndSetLanguage();

  // Show login success
  showSimpleNotification('데모 로그인 성공! 무제한 생성 + 리미트 초기화 완료');

  // Update UI
  console.log('🔄 Updating login button...');
  updateLoginButton();

  // Generate demo API key
  console.log('🔑 Generating demo API key...');
  generateUserApiKey();
  
  console.log('✅ Demo login complete!');
}

// Check for existing user session and restore login state
function checkExistingSession(): void {
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  const userData = sessionStorage.getItem('userData');
  const apiKey = sessionStorage.getItem('userApiKey');
  
  if (isLoggedIn && userData && apiKey) {
    try {
      currentUser = JSON.parse(userData);
      userApiKey = apiKey;
      
      console.log('🔄 Restored user session:', currentUser?.name);
      updateLoginButton();
      
      // Don't show notification on page refresh, just log
      console.log('✅ Session restored for:', currentUser?.name);
    } catch (error) {
      console.error('❌ Failed to restore session:', error);
      // Clear corrupted session data
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('userData');
      sessionStorage.removeItem('userApiKey');
    }
  }
}

export function initGoogleAuth(): void {
  // Load Google Identity Services
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    console.error('❌ Failed to load Google Identity Services script');
    // Still setup button for demo mode
    setupGoogleLoginButton();
  };
  
  document.head.appendChild(script);

  script.onload = () => {
    // Always show the Google login button
    setupGoogleLoginButton();
    
    // Don't auto-restore session on first load
    // checkExistingSession();
    
    // Get Google Client ID from environment variable
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
    
    console.log('🔑 Checking Google OAuth configuration...');
    console.log('Raw env value:', (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID);
    console.log('Client ID found:', clientId !== 'YOUR_GOOGLE_CLIENT_ID' ? '✅ Configured' : '❌ Not configured');
    
    if (clientId === 'YOUR_GOOGLE_CLIENT_ID' || !clientId || clientId === undefined) {
      console.warn('⚠️ Google OAuth not configured. Demo mode available on click.');
      return;
    }

    console.log('🚀 Initializing Google OAuth with Client ID:', clientId.substring(0, 20) + '...');
    
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    
    console.log('✅ Google OAuth initialized successfully');
  };
}

function setupGoogleLoginButton(): void {
  const languageSelector = document.querySelector('.language-selector');
  if (!languageSelector) {
    console.error('❌ Language selector not found, cannot create Google login button');
    return;
  }

  // Check if button already exists
  const existingButton = document.getElementById('googleLoginButton');
  if (existingButton) {
    console.log('🔄 Google login button already exists, skipping creation');
    return;
  }

  // Check if header right group already exists
  let headerRightGroup = document.querySelector('.header-right-group');
  
  if (!headerRightGroup) {
    // Create header right group and move language selector into it
    headerRightGroup = document.createElement('div');
    headerRightGroup.className = 'header-right-group';
    
    // Move language selector into the group
    languageSelector.parentNode?.insertBefore(headerRightGroup, languageSelector);
    headerRightGroup.appendChild(languageSelector);
  }

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
  googleLoginButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🖱️ Google login button clicked - event triggered');
    
    // Check if OAuth is configured
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
    
    console.log('Raw env value:', (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID);
    console.log('Client ID:', clientId);
    console.log('OAuth configured:', clientId !== 'YOUR_GOOGLE_CLIENT_ID' ? 'Yes' : 'No');
    console.log('Window.google available:', !!window.google);
    console.log('Google accounts API:', !!window.google?.accounts);
    
    if (clientId === 'YOUR_GOOGLE_CLIENT_ID' || !clientId || clientId === undefined) {
      // Demo mode - simulate login for testing
      console.log('🧪 Using demo mode login');
      simulateDemoLogin();
      return;
    }
    
    console.log('🔐 Attempting real Google OAuth login');
    
    if (window.google?.accounts?.id?.prompt) {
      console.log('✅ Google API loaded, showing login prompt');
      try {
        window.google.accounts.id.prompt();
        console.log('✅ Login prompt triggered successfully');
      } catch (error) {
        console.error('❌ Error triggering login prompt:', error);
        // Fallback to demo mode if OAuth fails
        console.log('🔄 Falling back to demo mode');
        simulateDemoLogin();
      }
    } else {
      console.log('⏳ Google API not yet loaded, attempting to reinitialize');
      
      // Try to reinitialize Google API
      if (window.google?.accounts?.id) {
        try {
          console.log('🔄 Reinitializing Google OAuth...');
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });
          
          setTimeout(() => {
            if (window.google?.accounts?.id?.prompt) {
              window.google.accounts.id.prompt();
            } else {
              console.log('🧪 Still no Google API, using demo mode');
              simulateDemoLogin();
            }
          }, 500);
        } catch (error) {
          console.error('❌ Error reinitializing Google OAuth:', error);
          simulateDemoLogin();
        }
      } else {
        console.log('🧪 Google API completely unavailable, using demo mode');
        simulateDemoLogin();
      }
    }
  });

  // Insert Google button before language selector within the group
  headerRightGroup.insertBefore(googleLoginButton, languageSelector);

  // Create tooltip
  createTooltip(googleLoginButton);
  
  console.log('✅ Google login button created and added to DOM');
  console.log('Button element:', googleLoginButton);
  console.log('Button in DOM:', document.getElementById('googleLoginButton') !== null);
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
  
  // Remove existing event listeners
  const newButton = button.cloneNode(true) as HTMLElement;
  button.parentNode?.replaceChild(newButton, button);
  
  // Add logout functionality to the new button
  newButton.addEventListener('click', handleLogout);
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
    
    // Remove existing event listeners and restore original login handler
    const newButton = button.cloneNode(true) as HTMLElement;
    button.parentNode?.replaceChild(newButton, button);
    
    // Add the original login click handler back
    newButton.addEventListener('click', () => {
      // Check if OAuth is configured
      const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
      
      console.log('🖱️ Google login button clicked');
      console.log('OAuth configured:', clientId !== 'YOUR_GOOGLE_CLIENT_ID' ? 'Yes' : 'No');
      
      if (clientId === 'YOUR_GOOGLE_CLIENT_ID' || !clientId || clientId === undefined) {
        // Demo mode - simulate login for testing
        console.log('🧪 Using demo mode login');
        simulateDemoLogin();
        return;
      }
      
      console.log('🔐 Attempting real Google OAuth login');
      
      if (window.google?.accounts?.id?.prompt) {
        console.log('✅ Google API loaded, showing login prompt');
        window.google.accounts.id.prompt();
      } else {
        console.log('⏳ Google API not yet loaded');
        showSimpleNotification('Google 로그인 서비스를 로드하는 중입니다...');
      }
    });
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
