import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { GeneralSettingsScreen } from '../src/screens/me/GeneralSettingsScreen';

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

function ModeProbe() {
  const { mode } = useTheme();
  return <Text testID="mode-probe">{mode}</Text>;
}

describe('General Settings appearance', () => {
  test('selecting Light updates the global mode and Appearance subtitle', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <GeneralSettingsScreen
            navigation={{ goBack: jest.fn() } as never}
            route={{ key: 'GeneralSettings', name: 'GeneralSettings' }}
          />
          <ModeProbe />
        </ThemeProvider>,
      );
    });

    const appearance = renderer!.root.findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        node.props.accessibilityLabel === 'Appearance',
    )[0];
    act(() => appearance.props.onPress());

    const lightOption = renderer!.root.findAll(
      node =>
        node.props.accessibilityRole === 'radio' &&
        node.props.accessibilityLabel === 'Light theme',
    )[0];
    act(() => lightOption.props.onPress());

    expect(
      renderer!.root.findByProps({ testID: 'mode-probe' }).props.children,
    ).toBe('light');
    expect(
      renderer!.root
        .findAllByType(Text)
        .some(node => node.props.children === 'Light'),
    ).toBe(true);

    act(() => renderer!.unmount());
  });
});
