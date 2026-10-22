export const AUTH_TOKEN_STORAGE_KEY = 'mindmark.auth.token';
const LEGACY_AUTH_TOKEN_STORAGE_KEY = 'mindmark.dev.token';

export function readAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token) {
    return token;
  }

  const legacyToken = window.localStorage.getItem(LEGACY_AUTH_TOKEN_STORAGE_KEY);
  if (legacyToken) {
    window.localStorage.removeItem(LEGACY_AUTH_TOKEN_STORAGE_KEY);
  }

  return null;
}

export function writeAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  window.localStorage.removeItem(LEGACY_AUTH_TOKEN_STORAGE_KEY);
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_AUTH_TOKEN_STORAGE_KEY);
}
