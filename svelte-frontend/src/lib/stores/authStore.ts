import { browser } from '$app/environment';
import { modal } from './modal';
import { LL } from '$lib';
import { get } from 'svelte/store';

type LoginErrorKey = 'invalidLogin';
type RegisterErrorKey = 'confirmPasswordMismatch' | 'invalidCredentials' | 'usernameTaken';

async function authApiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`/connect/seiko/${path}`, {
    ...init,
    credentials: 'include'
  });
}

function toSearchParams(formData: FormData): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      params.append(key, value);
    }
  }
  return params;
}

export const auth = {
  userInfo: browser ? null : undefined,

  handleLoginClick: () => {
    modal.open('loginModal');
  },

  handleLogoutClick: async () => {
    const logoutConfirmed = confirm(get(LL).messages.logout());
    if (!logoutConfirmed) return;

    try {
      const response = await authApiFetch('logout');
      if (!response.ok) {
        console.error('Logout failed:', response.statusText);
      }
      if (browser) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  handleLoginSubmit: async (formData: FormData): Promise<{ ok: true } | { ok: false; errorKey: LoginErrorKey }> => {
    try {
      const response = await authApiFetch('login', {
        method: 'POST',
        body: toSearchParams(formData),
        headers: {
          Accept: 'application/x-www-form-urlencoded',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        return { ok: false, errorKey: 'invalidLogin' };
      }

      modal.close();
      if (browser) {
        window.location.reload();
      }
      return { ok: true };
    } catch (error) {
      console.error('Login error:', error);
      return { ok: false, errorKey: 'invalidLogin' };
    }
  },

  handleRegisterSubmit: async (
    formData: FormData
  ): Promise<{ ok: true } | { ok: false; errorKey: RegisterErrorKey }> => {
    try {
      const response = await authApiFetch('register', {
        method: 'POST',
        body: toSearchParams(formData),
        headers: {
          Accept: 'application/x-www-form-urlencoded',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        const errorText = (await response.text()).trim();
        const errorKey: RegisterErrorKey = errorText === 'user exists' ? 'usernameTaken' : 'invalidCredentials';
        return { ok: false, errorKey };
      }

      modal.open('loginModal');
      return { ok: true };
    } catch (error) {
      console.error('Register error:', error);
      return { ok: false, errorKey: 'invalidCredentials' };
    }
  }
};

export default auth;
