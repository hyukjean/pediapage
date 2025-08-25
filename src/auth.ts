/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getState, setState } from './state';
import type { GoogleUser } from './types';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = 'your-google-client-id'; // Replace with actual client ID
const GOOGLE_SCOPES = 'openid profile email';

/**
 * Initialize Google Sign-In
 */
export const initializeGoogleAuth = () => {
  return new Promise<void>((resolve) => {
    // Load Google Sign-In script
    if (document.getElementById('google-signin-script')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-signin-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      // Initialize Google Sign-In
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
        auto_select: false,
        cancel_on_tap_outside: false,
      });
      
      console.log('🔐 Google Sign-In initialized');
      resolve();
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Handle Google Sign-In response
 */
const handleGoogleSignIn = async (response: any) => {
  try {
    // Decode JWT token
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    
    const user: GoogleUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      locale: payload.locale,
    };

    console.log('🔐 Google Sign-In successful:', user.email);
    
    // Auto-detect language from Google account
    if (user.locale) {
      const langCode = user.locale.split('-')[0].toLowerCase();
      const supportedLanguages = ['en', 'ko', 'ja', 'de', 'it', 'no'];
      if (supportedLanguages.includes(langCode)) {
        const { setLanguage } = await import('./i18n');
        setLanguage(langCode as any);
        console.log(`🌍 Language set from Google account: ${langCode}`);
      }
    }

    // Check if user has stored API key
    await loadUserApiKey(user);
    
    // Update state
    setState({ currentUser: user });
    
    // Update UI (import to avoid circular dependencies)
    const { updateAuthUI } = await import('./ui');
    updateAuthUI();
    
    // Show API key setup if needed
    if (!user.apiKey) {
      showApiKeySetupModal(user);
    }

  } catch (error) {
    console.error('Google Sign-In error:', error);
  }
};

/**
 * Load user's stored API key from secure storage
 */
const loadUserApiKey = async (user: GoogleUser) => {
  try {
    // In a real app, this would be stored securely on your backend
    const savedApiKey = localStorage.getItem(`pedia-api-key-${user.id}`);
    if (savedApiKey) {
      user.apiKey = savedApiKey;
      console.log('🔑 Loaded user API key from storage');
    }
  } catch (error) {
    console.error('Failed to load API key:', error);
  }
};

/**
 * Save user's API key securely
 */
export const saveUserApiKey = (user: GoogleUser, apiKey: string) => {
  try {
    // Validate API key format (basic check)
    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
      throw new Error('Invalid API key format');
    }

    // In production, encrypt this or store on your secure backend
    localStorage.setItem(`pedia-api-key-${user.id}`, apiKey);
    
    user.apiKey = apiKey;
    setState({ currentUser: user });
    
    console.log('🔑 API key saved successfully');
    return true;
  } catch (error) {
    console.error('Failed to save API key:', error);
    return false;
  }
};

/**
 * Sign out user
 */
export const signOut = async () => {
  window.google?.accounts.id.disableAutoSelect();
  setState({ currentUser: null });
  
  // Update UI (import to avoid circular dependencies)
  const { updateAuthUI } = await import('./ui');
  updateAuthUI();
  
  console.log('🔐 User signed out');
};

/**
 * Show API key setup modal
 */
const showApiKeySetupModal = (user: GoogleUser) => {
  const modal = document.createElement('div');
  modal.className = 'api-key-modal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <h3>🔑 Connect Your Personal API Key</h3>
        <p>Hi <strong>${user.name}</strong>! To use unlimited AI features, connect your personal Google Gemini API key:</p>
        
        <div class="api-key-benefits">
          <div class="benefit">
            <span class="benefit-icon">🚀</span>
            <span>Unlimited requests</span>
          </div>
          <div class="benefit">
            <span class="benefit-icon">🔒</span>
            <span>Private & secure</span>
          </div>
          <div class="benefit">
            <span class="benefit-icon">💰</span>
            <span>Google's free tier: 1M tokens/month</span>
          </div>
        </div>

        <div class="api-key-setup">
          <p><strong>Get your FREE API key:</strong></p>
          <ol>
            <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
            <li>Click "Create API Key"</li>
            <li>Copy the key and paste it below:</li>
          </ol>
          
          <input type="password" id="apiKeyInput" placeholder="AIza..." class="api-key-input">
          <div class="modal-buttons">
            <button id="saveApiKey" class="primary-button">Save & Start Using</button>
            <button id="skipApiKey" class="secondary-button">Skip (Use Limited Demo)</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle save API key
  document.getElementById('saveApiKey')?.addEventListener('click', () => {
    const input = document.getElementById('apiKeyInput') as HTMLInputElement;
    const apiKey = input.value.trim();
    
    if (saveUserApiKey(user, apiKey)) {
      document.body.removeChild(modal);
      showSuccessMessage('🎉 API key connected! You now have unlimited access.');
    } else {
      input.style.borderColor = '#ef4444';
      input.placeholder = 'Invalid API key format (should start with AIza...)';
    }
  });

  // Handle skip
  document.getElementById('skipApiKey')?.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
};

/**
 * Show Google Sign-In popup
 */
const showGoogleSignIn = () => {
  // 바로 커스텀 로그인 모달 표시 (소개 페이지 건너뛰기)
  showCustomSignInModal();
};

/**
 * Show custom sign-in modal as fallback
 */
const showCustomSignInModal = () => {
  const modal = document.createElement('div');
  modal.className = 'signin-modal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <h3>🚀 Welcome to Pedia.page</h3>
        <p>Sign in to get unlimited AI-powered learning with your own API key!</p>
        
        <div id="google-signin-button"></div>
        
        <div class="signin-benefits">
          <div class="benefit">
            <span class="benefit-icon">🔑</span>
            <span>Use your own Google Gemini API (FREE)</span>
          </div>
          <div class="benefit">
            <span class="benefit-icon">🌍</span>
            <span>Auto-detect your language preferences</span>
          </div>
          <div class="benefit">
            <span class="benefit-icon">🚀</span>
            <span>Unlimited flashcard generation</span>
          </div>
        </div>
        
        <button class="close-modal">Continue without signing in</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Render Google Sign-In button
  window.google?.accounts.id.renderButton(
    document.getElementById('google-signin-button')!,
    {
      theme: 'outline',
      size: 'large',
      width: 300,
    }
  );

  // Handle close
  modal.querySelector('.close-modal')?.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
};

/**
 * Show success message
 */
const showSuccessMessage = (message: string) => {
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
};

// Make functions globally available
(window as any).signOut = signOut;
(window as any).showGoogleSignIn = showGoogleSignIn;
