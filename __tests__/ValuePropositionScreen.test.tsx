import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ThemeProvider } from '../src/context/ThemeContext';
import { ValuePropositionScreen } from '../src/screens/onboarding/ValuePropositionScreen';
import { useAppStore } from '../src/store/useAppStore';

jest.mock('@shopify/flash-list', () => ({
  FlashList: require('react-native').FlatList,
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    { __esModule: true },
    {
      get: (target, property) =>
        property === '__esModule' ? target.__esModule : View,
    },
  );
});

describe('ValuePropositionScreen', () => {
  const originalFinishOnboarding = useAppStore.getState().finishOnboarding;

  afterEach(() => {
    useAppStore.setState({ finishOnboarding: originalFinishOnboarding });
  });

  test('resets the root flow to Splash after onboarding completes', async () => {
    const dispatch = jest.fn();
    useAppStore.setState({
      finishOnboarding: jest.fn(async () => true),
    });
    const navigation = {
      getParent: () => ({ dispatch }),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <ValuePropositionScreen
            navigation={navigation as never}
            route={{ key: 'ValueProposition', name: 'ValueProposition' }}
          />
        </ThemeProvider>,
      );
    });

    const startButton = renderer!.root.findByProps({
      accessibilityLabel: 'START NOW!',
    });
    await act(async () => {
      startButton.props.onPress();
      await Promise.resolve();
    });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RESET',
        payload: { index: 0, routes: [{ name: 'Splash' }] },
      }),
    );
    act(() => renderer!.unmount());
  });
});
