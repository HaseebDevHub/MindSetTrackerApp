import { create } from 'zustand';
import {
  googleAuthService,
  normalizeGoogleAuthError,
  type GoogleAuthErrorCode,
  type GoogleAuthService,
  type GoogleAuthUser,
} from '../services/auth/googleAuthService';
import {
  googleAuthStorage,
  type GoogleAuthStorage,
} from '../storage/googleAuthStorage';

export type GoogleAuthActionResult =
  | { ok: true }
  | { ok: false; reason: GoogleAuthErrorCode };

export type GoogleAuthState = {
  user: GoogleAuthUser | null;
  isInitialized: boolean;
  isRestoring: boolean;
  isAuthenticating: boolean;
  error: GoogleAuthErrorCode | null;
  initialize: () => Promise<boolean>;
  connect: () => Promise<GoogleAuthActionResult>;
  disconnect: () => Promise<GoogleAuthActionResult>;
  clearError: () => void;
};

type Dependencies = {
  service: GoogleAuthService;
  persistence: GoogleAuthStorage;
};

const logAuthError = (operation: string, code: GoogleAuthErrorCode) => {
  if (__DEV__) console.warn(`[google-auth] ${operation} failed (${code})`);
};

export function createGoogleAuthStore(
  dependencyOverrides: Partial<Dependencies> = {},
) {
  const service = dependencyOverrides.service ?? googleAuthService;
  const persistence = dependencyOverrides.persistence ?? googleAuthStorage;
  let initializationPromise: Promise<boolean> | undefined;
  let connectPromise: Promise<GoogleAuthActionResult> | undefined;
  let disconnectPromise: Promise<GoogleAuthActionResult> | undefined;

  return create<GoogleAuthState>((set, get) => ({
    user: persistence.getUser(),
    isInitialized: false,
    isRestoring: false,
    isAuthenticating: false,
    error: null,

    initialize: () => {
      if (get().isInitialized) return Promise.resolve(true);
      if (initializationPromise) return initializationPromise;

      initializationPromise = (async () => {
        set({ isRestoring: true, error: null });
        try {
          service.configure();
          const user = await service.restoreSession();
          if (user) persistence.setUser(user);
          else persistence.clearUser();
          set({ user, isInitialized: true, isRestoring: false });
          return true;
        } catch (error) {
          const normalized = normalizeGoogleAuthError(error);
          logAuthError('session restoration', normalized.code);
          if (normalized.code === 'configuration') persistence.clearUser();
          set({
            user: normalized.code === 'configuration' ? null : get().user,
            isInitialized: true,
            isRestoring: false,
            error: normalized.code,
          });
          return false;
        } finally {
          initializationPromise = undefined;
        }
      })();

      return initializationPromise;
    },

    connect: () => {
      if (connectPromise) return connectPromise;
      if (disconnectPromise) {
        return Promise.resolve({ ok: false, reason: 'in_progress' });
      }

      connectPromise = (async () => {
        set({ isAuthenticating: true, error: null });
        try {
          const result = await service.signIn();
          if (result.status === 'cancelled') {
            return { ok: false, reason: 'cancelled' };
          }

          persistence.setUser(result.user);
          set({ user: result.user, isInitialized: true });
          return { ok: true };
        } catch (error) {
          const normalized = normalizeGoogleAuthError(error);
          logAuthError('sign in', normalized.code);
          set({ error: normalized.code });
          return { ok: false, reason: normalized.code };
        } finally {
          set({ isAuthenticating: false });
          connectPromise = undefined;
        }
      })();

      return connectPromise;
    },

    disconnect: () => {
      if (disconnectPromise) return disconnectPromise;
      if (connectPromise) {
        return Promise.resolve({ ok: false, reason: 'in_progress' });
      }

      disconnectPromise = (async () => {
        set({ isAuthenticating: true, error: null });
        try {
          await service.signOut();
          persistence.clearUser();
          set({ user: null, isInitialized: true });
          return { ok: true };
        } catch (error) {
          const normalized = normalizeGoogleAuthError(error);
          logAuthError('sign out', normalized.code);
          set({ error: normalized.code });
          return { ok: false, reason: normalized.code };
        } finally {
          set({ isAuthenticating: false });
          disconnectPromise = undefined;
        }
      })();

      return disconnectPromise;
    },

    clearError: () => set({ error: null }),
  }));
}

export const useGoogleAuthStore = createGoogleAuthStore();
