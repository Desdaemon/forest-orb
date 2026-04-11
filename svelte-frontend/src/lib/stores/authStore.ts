import { browser } from '$app/environment';
import { modal } from './modal';

/** 
 * AuthStore - Manages user authentication state and login/logout flow
 */

// Store for auth state (using readable-writable for reactive updates)
export const auth = {
  // Current user info (null if not logged in)
  userInfo: browser ? null : undefined,

  /**
   * Open the login modal and reset state
   */
  openLoginModal: () => {
    // Clear any existing errors
    if (window && window.loginError) {
      window.loginError.classList.add('hidden');
    }
    if (window && window.loginForm) {
      window.loginForm.reset();
    }
  },

  /**
   * Handle login button click (replicates original implementation)
   */
  handleLoginClick: () => {
    const loginButton = document.getElementById('loginButton');
    const loginModal = document.getElementById('loginModal');
    const loginErrorRow = document.getElementById('loginErrorRow');

    // Clear errors
    if (loginErrorRow) {
      loginErrorRow.classList.add('hidden');
    }

    // Reset Turnstile (reCAPTCHA)
    window.turnstile?.reset();

    // Open modal
    if (loginModal) {
      modal.open('loginModal');
    }
  },

  /**
   * Handle logout button click
   */
  handleLogoutClick: async () => {
    // Confirm logout
    const logoutConfirmed = confirm('Are you sure you want to logout?');
    if (!logoutConfirmed) return;

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        console.error('Logout failed:', response.statusText);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear session
    if (window && window.closeSessionWs) {
      window.closeSessionWs();
    }

    // Update UI
    if (window && window.fetchAndUpdatePlayerInfo) {
      window.fetchAndUpdatePlayerInfo(false);
    }
  },

  /**
   * Handle login form submission
   */
  handleLoginSubmit: async (formData: FormData, usernameElement: HTMLInputElement, passwordElement: HTMLInputElement) => {
    const loginErrorRow: HTMLElement = document.getElementById('loginErrorRow');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: new URLSearchParams(formData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        loginErrorRow?.classList.remove('hidden');
        // Set error message (placeholder - customize with actual API response)
        console.error('Login failed:', errorText);
        window.turnstile?.reset();
        return false;
      }

      // Success - fetch user info and close modal
      if (window && window.fetchAndUpdatePlayerInfo) {
        window.fetchAndUpdatePlayerInfo(true);
      }

      modal.close();
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  /**
   * Handle register form submission
   */
  handleRegisterSubmit: async (formData: FormData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: new URLSearchParams(formData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorRow = document.getElementById('registerErrorRow');
        
        if (errorRow) {
          errorRow.classList.remove('hidden');
          // Set error message based on error type
        }
        
        window.turnstile?.reset();
        return false;
      }

      // Success - clear errors and switch to login modal
      document.getElementById('loginErrorRow')?.classList.add('hidden');
      modal.open('loginModal');
      window.turnstile?.reset();
      
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  }
};

// Initial check if user is logged in
if (browser && typeof window !== 'undefined') {
  // Fetch user info if needed
  // auth.checkAuthStatus();
}

export default auth;
