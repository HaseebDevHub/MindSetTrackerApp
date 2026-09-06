import type { GoogleAuthUser } from '../services/auth/googleAuthService';
import { storage } from './storage';
import { STORAGE_KEYS } from './storageKeys';

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const isGoogleAuthUser = (value: unknown): value is GoogleAuthUser => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<GoogleAuthUser>;

  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.email === 'string' &&
    candidate.email.length > 0 &&
    isNullableString(candidate.name) &&
    isNullableString(candidate.photo) &&
    isNullableString(candidate.givenName) &&
    isNullableString(candidate.familyName)
  );
};

export const googleAuthStorage = {
  getUser(): GoogleAuthUser | null {
    const serialized = storage.getString(STORAGE_KEYS.GOOGLE_AUTH_USER);
    if (!serialized) return null;

    try {
      const parsed: unknown = JSON.parse(serialized);
      if (isGoogleAuthUser(parsed)) return parsed;
    } catch {
      // Invalid cached profile data is non-fatal and is replaced on restoration.
    }

    storage.remove(STORAGE_KEYS.GOOGLE_AUTH_USER);
    return null;
  },

  setUser(user: GoogleAuthUser) {
    return storage.setString(
      STORAGE_KEYS.GOOGLE_AUTH_USER,
      JSON.stringify(user),
    );
  },

  clearUser() {
    return storage.remove(STORAGE_KEYS.GOOGLE_AUTH_USER);
  },
};

export type GoogleAuthStorage = typeof googleAuthStorage;
