import { useGoogleAuthStore } from '../store/useGoogleAuthStore';

export function useGoogleAuth() {
  const user = useGoogleAuthStore(state => state.user);
  const isInitialized = useGoogleAuthStore(state => state.isInitialized);
  const isRestoring = useGoogleAuthStore(state => state.isRestoring);
  const isAuthenticating = useGoogleAuthStore(state => state.isAuthenticating);
  const error = useGoogleAuthStore(state => state.error);
  const initialize = useGoogleAuthStore(state => state.initialize);
  const connect = useGoogleAuthStore(state => state.connect);
  const disconnect = useGoogleAuthStore(state => state.disconnect);
  const clearError = useGoogleAuthStore(state => state.clearError);

  return {
    user,
    isConnected: user !== null,
    isInitialized,
    isRestoring,
    isAuthenticating,
    error,
    initialize,
    connect,
    disconnect,
    clearError,
  };
}
