import type { AuthSession, StoredUser } from './types';

const USERS_KEY = 'hotel_pos_users';
const SESSION_KEY = 'hotel_pos_auth_session';

export interface AuthStorage {
  getUsers(): StoredUser[];
  saveUsers(users: StoredUser[]): void;
  getSession(): AuthSession | null;
  setSession(session: AuthSession | null): void;
}

export const localStorageAuthStorage: AuthStorage = {
  getUsers(): StoredUser[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveUsers(users: StoredUser[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  },

  setSession(session: AuthSession | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (session) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // sessionStorage unavailable
    }
  },
};
