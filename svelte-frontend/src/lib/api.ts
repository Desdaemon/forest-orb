export type UserInfo = {
  id: string;
  name: string;
  email?: string;
  gameId?: string;
  [extra: string]: any;
};

import { getGameInitState } from './init';

function getApiUrl() {
  if (typeof window === 'undefined') return '/api';
  const initState = getGameInitState();
  return initState.apiUrl ?? '/api';
}

const API_BASE = typeof window === 'undefined' ? '/api' : getApiUrl();

function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return (window as any).YNO_AUTH_TOKEN || '';
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Local-only mock mode (no connect.ynoproject.net calls)
  // Remove this branch when ready to enable real API.
  if (typeof window !== 'undefined') {
    if (path.startsWith('/info')) {
      return Promise.resolve({ id: 'mock-user', name: 'Mock User', gameId: '2kki' } as unknown as T);
    }
    if (path.startsWith('/savesync')) {
      return Promise.resolve({ timestamp: Date.now() } as unknown as T);
    }
  }

  const headers = new Headers(init.headers ?? {});
  headers.set('Content-Type', 'application/json');
  const sessionToken = getAuthToken();
  if (sessionToken) headers.set('Authorization', sessionToken);

  const base = typeof window === 'undefined' ? '/api' : getApiUrl();
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    throw new Error(`API ${path} failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getInfo(): Promise<UserInfo> {
  return apiFetch<UserInfo>('/info', { method: 'GET' });
}

export async function getSaveSyncTimestamp(): Promise<{ timestamp: number }> {
  return apiFetch<{ timestamp: number }>(`/savesync?command=timestamp`, { method: 'GET' });
}
