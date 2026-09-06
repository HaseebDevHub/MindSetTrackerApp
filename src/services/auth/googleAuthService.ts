import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
  type User,
} from '@react-native-google-signin/google-signin';

const GOOGLE_WEB_CLIENT_ID =
  '677726781010-p2s7gq3mtcak1floke2rsf2penquivua.apps.googleusercontent.com';

export type GoogleAuthUser = {
  id: string;
  email: string;
  name: string | null;
  photo: string | null;
  givenName: string | null;
  familyName: string | null;
};

export type GoogleAuthErrorCode =
  | 'cancelled'
  | 'in_progress'
  | 'play_services_unavailable'
  | 'network'
  | 'configuration'
  | 'not_signed_in'
  | 'unknown';

export type GoogleSignInResult =
  | { status: 'success'; user: GoogleAuthUser }
  | { status: 'cancelled' };

export class GoogleAuthError extends Error {
  constructor(public readonly code: GoogleAuthErrorCode) {
    super(`Google authentication failed: ${code}`);
    this.name = 'GoogleAuthError';
  }
}

const mapGoogleUser = (result: User): GoogleAuthUser => ({
  id: result.user.id,
  email: result.user.email,
  name: result.user.name,
  photo: result.user.photo,
  givenName: result.user.givenName,
  familyName: result.user.familyName,
});

export function normalizeGoogleAuthError(error: unknown): GoogleAuthError {
  if (error instanceof GoogleAuthError) return error;

  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.IN_PROGRESS) {
      return new GoogleAuthError('in_progress');
    }
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return new GoogleAuthError('play_services_unavailable');
    }

    const nativeCode = error.code.toUpperCase();
    if (nativeCode === 'NETWORK_ERROR' || nativeCode === '7') {
      return new GoogleAuthError('network');
    }
    if (
      nativeCode === 'DEVELOPER_ERROR' ||
      nativeCode === 'CONFIGURATION_ERROR' ||
      nativeCode === '10'
    ) {
      return new GoogleAuthError('configuration');
    }
  }

  if (
    error instanceof Error &&
    /network|offline|timed?\s*out/i.test(error.message)
  ) {
    return new GoogleAuthError('network');
  }
  if (
    error instanceof Error &&
    /client.?id|configuration|configured|developer.?error/i.test(error.message)
  ) {
    return new GoogleAuthError('configuration');
  }

  return new GoogleAuthError('unknown');
}

let isConfigured = false;

export function configureGoogleSignIn() {
  if (isConfigured) return;

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });
  isConfigured = true;
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  configureGoogleSignIn();

  try {
    const hasPlayServices = await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
    if (!hasPlayServices) {
      throw new GoogleAuthError('play_services_unavailable');
    }

    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return { status: 'cancelled' };

    return { status: 'success', user: mapGoogleUser(response.data) };
  } catch (error) {
    throw normalizeGoogleAuthError(error);
  }
}

export function getCurrentGoogleUser(): GoogleAuthUser | null {
  configureGoogleSignIn();
  const currentUser = GoogleSignin.getCurrentUser();
  return currentUser ? mapGoogleUser(currentUser) : null;
}

export async function restorePreviousGoogleSession(): Promise<GoogleAuthUser | null> {
  configureGoogleSignIn();

  try {
    const currentUser = GoogleSignin.getCurrentUser();
    if (currentUser) return mapGoogleUser(currentUser);

    const response = await GoogleSignin.signInSilently();
    return response.type === 'success' ? mapGoogleUser(response.data) : null;
  } catch (error) {
    throw normalizeGoogleAuthError(error);
  }
}

export async function signOutGoogle(): Promise<void> {
  configureGoogleSignIn();

  try {
    await GoogleSignin.signOut();
  } catch (error) {
    throw normalizeGoogleAuthError(error);
  }
}

export async function getGoogleAccessToken(): Promise<string> {
  configureGoogleSignIn();

  try {
    if (!GoogleSignin.getCurrentUser()) {
      const restoredUser = await restorePreviousGoogleSession();
      if (!restoredUser) throw new GoogleAuthError('not_signed_in');
    }

    const { accessToken } = await GoogleSignin.getTokens();
    if (!accessToken) throw new GoogleAuthError('not_signed_in');
    return accessToken;
  } catch (error) {
    throw normalizeGoogleAuthError(error);
  }
}

export type GoogleAuthService = {
  configure: typeof configureGoogleSignIn;
  signIn: typeof signInWithGoogle;
  signOut: typeof signOutGoogle;
  getCurrentUser: typeof getCurrentGoogleUser;
  restoreSession: typeof restorePreviousGoogleSession;
  getAccessToken: typeof getGoogleAccessToken;
};

export const googleAuthService: GoogleAuthService = {
  configure: configureGoogleSignIn,
  signIn: signInWithGoogle,
  signOut: signOutGoogle,
  getCurrentUser: getCurrentGoogleUser,
  restoreSession: restorePreviousGoogleSession,
  getAccessToken: getGoogleAccessToken,
};
