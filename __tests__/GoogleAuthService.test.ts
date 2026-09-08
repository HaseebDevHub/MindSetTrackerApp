import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  configureGoogleSignIn,
  ensureGoogleDriveScope,
  getGoogleAccessToken,
  refreshGoogleAccessToken,
  restorePreviousGoogleSession,
  signInWithGoogle,
  signOutGoogle,
} from '../src/services/auth/googleAuthService';

const googleSignin = jest.mocked(GoogleSignin);

const nativeUser = {
  user: {
    id: 'google-user-1',
    email: 'person@example.com',
    name: 'Example Person',
    photo: 'https://example.com/photo.jpg',
    givenName: 'Example',
    familyName: 'Person',
  },
  scopes: ['email', 'profile'],
  idToken: 'not-used-by-app',
  serverAuthCode: null,
};

describe('googleAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    googleSignin.hasPlayServices.mockResolvedValue(true);
    googleSignin.getCurrentUser.mockReturnValue(null);
    googleSignin.hasPreviousSignIn.mockReturnValue(false);
  });

  test('configures Original Google Sign-In with the Web client ID', () => {
    configureGoogleSignIn();

    expect(googleSignin.configure).toHaveBeenCalledWith({
      webClientId:
        '677726781010-p2s7gq3mtcak1floke2rsf2penquivua.apps.googleusercontent.com',
      scopes: ['https://www.googleapis.com/auth/drive.appdata'],
    });
  });

  test('opens interactive sign-in and returns only basic profile fields', async () => {
    googleSignin.signIn.mockResolvedValue({
      type: 'success',
      data: nativeUser,
    });

    await expect(signInWithGoogle()).resolves.toEqual({
      status: 'success',
      user: nativeUser.user,
    });
    expect(googleSignin.hasPlayServices).toHaveBeenCalledWith({
      showPlayServicesUpdateDialog: true,
    });
  });

  test('treats account-selector cancellation as a non-error result', async () => {
    googleSignin.signIn.mockResolvedValue({ type: 'cancelled', data: null });

    await expect(signInWithGoogle()).resolves.toEqual({
      status: 'cancelled',
    });
  });

  test('restores a previous session silently without opening the selector', async () => {
    googleSignin.hasPreviousSignIn.mockReturnValue(true);
    googleSignin.signInSilently.mockResolvedValue({
      type: 'success',
      data: nativeUser,
    });

    await expect(restorePreviousGoogleSession()).resolves.toEqual(
      nativeUser.user,
    );
    expect(googleSignin.signIn).not.toHaveBeenCalled();
  });

  test('signs out without revoking access and exposes an on-demand token', async () => {
    googleSignin.getCurrentUser.mockReturnValue(nativeUser);
    googleSignin.getTokens.mockResolvedValue({
      accessToken: 'temporary-access-token',
      idToken: 'temporary-id-token',
    });

    await expect(getGoogleAccessToken()).resolves.toBe(
      'temporary-access-token',
    );
    await expect(signOutGoogle()).resolves.toBeUndefined();
    expect(googleSignin.signOut).toHaveBeenCalledTimes(1);
  });

  test('requests only the app-data scope for an existing account', async () => {
    googleSignin.getCurrentUser.mockReturnValue(nativeUser);
    googleSignin.addScopes.mockResolvedValue({
      type: 'success',
      data: {
        ...nativeUser,
        scopes: [
          ...nativeUser.scopes,
          'https://www.googleapis.com/auth/drive.appdata',
        ],
      },
    });

    await expect(ensureGoogleDriveScope()).resolves.toBeUndefined();
    expect(googleSignin.addScopes).toHaveBeenCalledWith({
      scopes: ['https://www.googleapis.com/auth/drive.appdata'],
    });
  });

  test('clears a rejected cached token before getting a replacement', async () => {
    googleSignin.getCurrentUser.mockReturnValue(nativeUser);
    googleSignin.getTokens.mockResolvedValue({
      accessToken: 'replacement-token',
      idToken: 'unused',
    });

    await expect(refreshGoogleAccessToken('rejected-token')).resolves.toBe(
      'replacement-token',
    );
    expect(googleSignin.clearCachedAccessToken).toHaveBeenCalledWith(
      'rejected-token',
    );
  });
});
