export type UserInfo = {
  id: string;
  name: string;
  email?: string;
  gameId?: string;
  [extra: string]: unknown;
};

import { getGameInitState } from './init';

function getApiUrl() {
  if (typeof window === 'undefined') return '/connect/2kki/api';
  const initState = getGameInitState();
  return `/connect/${initState.gameId}/api`;
}

function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return ((window as Record<string, unknown>).YNO_AUTH_TOKEN as string) || '';
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set('Content-Type', 'application/json');
  const sessionToken = getAuthToken();
  if (sessionToken) headers.set('Authorization', sessionToken);

  const base = getApiUrl();
  const response = await fetch(`${base}/${path}`, {
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

export async function apiJsonPost<T>(path: string, data: unknown): Promise<T> {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  const sessionToken = getAuthToken();
  if (sessionToken) headers.set('Authorization', sessionToken);

  const base = getApiUrl();
  const response = await fetch(`${base}/${path}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`API POST ${path} failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function apiBinaryPost<T>(
  path: string,
  data: Uint8Array,
  contentType: string = 'application/png'
): Promise<T> {
  const headers = new Headers();
  headers.set('Content-Type', contentType);
  headers.set('Accept', contentType);
  const sessionToken = getAuthToken();
  if (sessionToken) headers.set('Authorization', sessionToken);

  const base = getApiUrl();
  const response = await fetch(`${base}/${path}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: data.buffer as ArrayBuffer
  });

  if (!response.ok) {
    throw new Error(`API POST ${path} failed: ${response.status} ${response.statusText}`);
  }

  return response.text() as unknown as Promise<T>;
}

/** Convert a data URL to a Uint8Array of binary data. */
export function dataUrlToBinary(dataUrl: string): Uint8Array {
  const arr = dataUrl.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const ret = new Uint8Array(n);
  while (n--) ret[n] = bstr.charCodeAt(n);
  return ret;
}
