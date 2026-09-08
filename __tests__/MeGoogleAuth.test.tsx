import React from 'react';
import { Alert, Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { ThemeProvider } from '../src/context/ThemeContext';
import { MeScreen } from '../src/screens/me/MeScreen';
import type { GoogleAuthUser } from '../src/services/auth/googleAuthService';
import { useGoogleAuthStore } from '../src/store/useGoogleAuthStore';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    Easing: { cubic: jest.fn(), in: jest.fn(() => jest.fn()) },
    cancelAnimation: jest.fn(),
    runOnJS: (callback: (...args: unknown[]) => unknown) => callback,
    useAnimatedStyle: (factory: () => object) => factory(),
    useSharedValue: (value: unknown) => ({ value }),
    withSpring: (value: unknown) => value,
    withTiming: (value: unknown) => value,
  };
});

jest.mock('@shopify/flash-list', () => ({
  FlashList: require('react-native').FlatList,
}));
jest.mock(
  'lucide-react-native',
  () =>
    new Proxy(
      { __esModule: true },
      {
        get: (target, property) =>
          property === '__esModule' ? target.__esModule : () => null,
      },
    ),
);

const googleUser: GoogleAuthUser = {
  id: 'google-user-1',
  email: 'person@example.com',
  name: 'Example Person',
  photo: null,
  givenName: 'Example',
  familyName: 'Person',
};

const renderScreen = () =>
  TestRenderer.create(
    <ThemeProvider initialMode="light">
      <MeScreen
        navigation={{ navigate: jest.fn() } as never}
        route={{ key: 'MeHome', name: 'MeHome' }}
      />
    </ThemeProvider>,
  );

describe('Me Google Account card', () => {
  const originalState = useGoogleAuthStore.getState();

  afterEach(() => {
    useGoogleAuthStore.setState(originalState, true);
    jest.restoreAllMocks();
  });

  test('starts one centralized connect action when disconnected', async () => {
    const connect = jest.fn(async () => ({ ok: true as const }));
    useGoogleAuthStore.setState({
      ...originalState,
      user: null,
      isInitialized: true,
      isRestoring: false,
      isAuthenticating: false,
      connect,
    });
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = renderScreen();
    });

    const accountCard = renderer!.root.find(
      node => node.props.accessibilityLabel === 'Connect Google Account',
    );
    await act(async () => {
      accountCard.props.onPress();
      await Promise.resolve();
    });

    expect(connect).toHaveBeenCalledTimes(1);
    act(() => renderer!.unmount());
  });

  test('shows restored profile details and opens backup management', () => {
    useGoogleAuthStore.setState({
      ...originalState,
      user: googleUser,
      isInitialized: true,
      isRestoring: false,
      isAuthenticating: false,
    });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = renderScreen();
    });

    expect(
      renderer!.root
        .findAllByType(Text)
        .some(node => node.props.children === 'Example Person'),
    ).toBe(true);
    expect(
      renderer!.root
        .findAllByType(Text)
        .some(
          node => node.props.children === 'Connected as person@example.com',
        ),
    ).toBe(true);

    act(() => {
      renderer!.root
        .find(
          node =>
            node.props.accessibilityLabel ===
            'Manage backup for person@example.com',
        )
        .props.onPress();
    });
    expect(alert).toHaveBeenCalledWith(
      'Google Drive Backup',
      'person@example.com',
      expect.any(Array),
    );
    act(() => renderer!.unmount());
  });
});
