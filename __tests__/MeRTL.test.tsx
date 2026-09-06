import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { ThemeProvider } from '../src/context/ThemeContext';
import { setSelectedLanguage } from '../src/localization';
import { FeedbackScreen } from '../src/screens/me/FeedbackScreen';
import { MeScreen } from '../src/screens/me/MeScreen';

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

describe('Me RTL layout', () => {
  afterEach(() => setSelectedLanguage('English'));

  test('mirrors the Me home rows and aligns Urdu copy to the right', () => {
    setSelectedLanguage('Urdu');
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="light">
          <MeScreen
            navigation={{ navigate: jest.fn() } as never}
            route={{ key: 'MeHome', name: 'MeHome' }}
          />
        </ThemeProvider>,
      );
    });

    const notificationRow = renderer!.root.findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        node.props.accessibilityLabel === 'اطلاعات',
    )[0];
    const rowStyle =
      typeof notificationRow.props.style === 'function'
        ? notificationRow.props.style({ pressed: false })
        : notificationRow.props.style;
    expect(StyleSheet.flatten(rowStyle)).toMatchObject({
      flexDirection: 'row-reverse',
    });

    const notificationText = renderer!.root
      .findAllByType(Text)
      .find(node => node.props.children === 'اطلاعات');
    expect(StyleSheet.flatten(notificationText!.props.style)).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
    });
    act(() => renderer!.unmount());
  });

  test('mirrors the Me header and feedback input without global RTL', () => {
    setSelectedLanguage('Urdu');
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <FeedbackScreen
            navigation={{ goBack: jest.fn() } as never}
            route={{ key: 'Feedback', name: 'Feedback' }}
          />
        </ThemeProvider>,
      );
    });

    const headerTitle = renderer!.root
      .findAllByType(Text)
      .find(node => node.props.children === 'رائے');
    expect(StyleSheet.flatten(headerTitle!.parent!.props.style)).toMatchObject({
      flexDirection: 'row-reverse',
    });
    expect(
      StyleSheet.flatten(renderer!.root.findByType(TextInput).props.style),
    ).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
    });
    act(() => renderer!.unmount());
  });
});
