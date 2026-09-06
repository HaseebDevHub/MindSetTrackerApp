import type {
  GoogleAuthService,
  GoogleAuthUser,
} from '../src/services/auth/googleAuthService';
import type { GoogleAuthStorage } from '../src/storage/googleAuthStorage';
import { createGoogleAuthStore } from '../src/store/useGoogleAuthStore';

const user: GoogleAuthUser = {
  id: 'google-user-1',
  email: 'person@example.com',
  name: 'Example Person',
  photo: null,
  givenName: 'Example',
  familyName: 'Person',
};

const createDependencies = () => {
  const service: GoogleAuthService = {
    configure: jest.fn(),
    signIn: jest.fn(async () => ({ status: 'success' as const, user })),
    signOut: jest.fn(async () => undefined),
    getCurrentUser: jest.fn(() => null),
    restoreSession: jest.fn(async () => null),
    getAccessToken: jest.fn(async () => 'access-token'),
  };
  const persistence: GoogleAuthStorage = {
    getUser: jest.fn(() => null),
    setUser: jest.fn(() => true),
    clearUser: jest.fn(() => true),
  };
  return { service, persistence };
};

describe('useGoogleAuthStore', () => {
  test('restores and caches a previous native session only once', async () => {
    const dependencies = createDependencies();
    jest.mocked(dependencies.service.restoreSession).mockResolvedValue(user);
    const store = createGoogleAuthStore(dependencies);

    const [first, second] = await Promise.all([
      store.getState().initialize(),
      store.getState().initialize(),
    ]);

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(dependencies.service.restoreSession).toHaveBeenCalledTimes(1);
    expect(dependencies.persistence.setUser).toHaveBeenCalledWith(user);
    expect(store.getState().user).toEqual(user);
  });

  test('serializes repeated connect presses and publishes the signed-in user', async () => {
    const dependencies = createDependencies();
    let resolveSignIn:
      | ((value: { status: 'success'; user: GoogleAuthUser }) => void)
      | undefined;
    jest.mocked(dependencies.service.signIn).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveSignIn = resolve;
        }),
    );
    const store = createGoogleAuthStore(dependencies);

    const first = store.getState().connect();
    const second = store.getState().connect();
    resolveSignIn?.({ status: 'success', user });

    await expect(first).resolves.toEqual({ ok: true });
    await expect(second).resolves.toEqual({ ok: true });
    expect(dependencies.service.signIn).toHaveBeenCalledTimes(1);
    expect(store.getState().user).toEqual(user);
  });

  test('does not show a cached account after a configuration failure', async () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const dependencies = createDependencies();
    jest.mocked(dependencies.persistence.getUser).mockReturnValue(user);
    jest
      .mocked(dependencies.service.restoreSession)
      .mockRejectedValue(new Error('client ID is not configured'));
    const store = createGoogleAuthStore(dependencies);

    await expect(store.getState().initialize()).resolves.toBe(false);
    expect(store.getState().user).toBeNull();
    expect(dependencies.persistence.clearUser).toHaveBeenCalledTimes(1);
    warning.mockRestore();
  });

  test('keeps connected state when sign-out fails', async () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const dependencies = createDependencies();
    jest.mocked(dependencies.persistence.getUser).mockReturnValue(user);
    jest
      .mocked(dependencies.service.signOut)
      .mockRejectedValue(new Error('unexpected native failure'));
    const store = createGoogleAuthStore(dependencies);

    await expect(store.getState().disconnect()).resolves.toEqual({
      ok: false,
      reason: 'unknown',
    });
    expect(store.getState().user).toEqual(user);
    expect(dependencies.persistence.clearUser).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith(
      '[google-auth] sign out failed (unknown)',
    );
    warning.mockRestore();
  });

  test('clears only Google profile state after a successful sign-out', async () => {
    const dependencies = createDependencies();
    jest.mocked(dependencies.persistence.getUser).mockReturnValue(user);
    const store = createGoogleAuthStore(dependencies);

    await expect(store.getState().disconnect()).resolves.toEqual({ ok: true });
    expect(dependencies.service.signOut).toHaveBeenCalledTimes(1);
    expect(dependencies.persistence.clearUser).toHaveBeenCalledTimes(1);
    expect(store.getState().user).toBeNull();
  });
});
