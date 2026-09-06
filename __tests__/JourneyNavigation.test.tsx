import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { FlatList, StyleSheet, Text } from 'react-native';
import { ThemeProvider } from '../src/context/ThemeContext';
import { setSelectedLanguage } from '../src/localization';
import { JourneyDetailScreen } from '../src/screens/journey/JourneyDetailScreen';
import { JourneyScreen } from '../src/screens/journey/JourneyScreen';

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
jest.mock('../src/components/common/ToastMessage', () => ({
  ToastMessage: () => null,
}));

describe('Journey navigation', () => {
  afterEach(() => {
    act(() => {
      setSelectedLanguage('English');
    });
  });

  test('opens recommended and all-journey cards with the selected journey id', () => {
    const navigation = {
      navigate: jest.fn(),
      setParams: jest.fn(),
    };
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <JourneyScreen
            navigation={navigation as never}
            route={{ key: 'journey-home', name: 'JourneyHome' } as never}
          />
        </ThemeProvider>,
      );
    });

    act(() =>
      renderer!.root
        .findByProps({
          accessibilityLabel: 'Walk everyday for health',
        })
        .props.onPress(),
    );
    act(() =>
      renderer!.root
        .findAllByProps({
          accessibilityLabel: 'Keep fit at the office',
        })[0]
        .props.onPress(),
    );

    expect(navigation.navigate).toHaveBeenNthCalledWith(1, 'JourneyDetail', {
      journeyId: 'walk',
    });
    expect(navigation.navigate).toHaveBeenNthCalledWith(2, 'JourneyDetail', {
      journeyId: 'office',
    });
    act(() => renderer!.unmount());
  });

  test('renders the selected journey detail content', () => {
    const navigation = {
      goBack: jest.fn(),
      navigate: jest.fn(),
    };
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <JourneyDetailScreen
            navigation={navigation as never}
            route={
              {
                key: 'journey-detail-walk',
                name: 'JourneyDetail',
                params: { journeyId: 'walk' },
              } as never
            }
          />
        </ThemeProvider>,
      );
    });

    const text = renderer!.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .flat(Infinity);
    expect(text).toEqual(
      expect.arrayContaining([
        'Walk everyday for health',
        'Take a 10 minute walk',
        'Reach your daily step goal',
        'START JOURNEY',
      ]),
    );
    act(() => renderer!.unmount());
  });

  test('mirrors Journey home and detail content for Urdu', () => {
    setSelectedLanguage('Urdu');
    const navigation = {
      goBack: jest.fn(),
      navigate: jest.fn(),
      setParams: jest.fn(),
    };
    let homeRenderer: TestRenderer.ReactTestRenderer;
    act(() => {
      homeRenderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <JourneyScreen
            navigation={navigation as never}
            route={{ key: 'journey-home-rtl', name: 'JourneyHome' } as never}
          />
        </ThemeProvider>,
      );
    });

    const pageTitle = homeRenderer!.root
      .findAllByType(Text)
      .find(node => node.props.children === 'سفر');
    expect(StyleSheet.flatten(pageTitle!.props.style)).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
    });
    expect(StyleSheet.flatten(pageTitle!.parent!.props.style)).toMatchObject({
      flexDirection: 'row-reverse',
    });
    expect(
      homeRenderer!.root
        .findAllByType(FlatList)
        .some(list => list.props.horizontal && list.props.inverted),
    ).toBe(true);
    const artworkTitle = homeRenderer!.root
      .findAllByType(Text)
      .find(node => node.props.children === 'صحت کے لیے روزانہ چلیں');
    expect(StyleSheet.flatten(artworkTitle!.props.style)).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
    });
    act(() => homeRenderer!.unmount());

    let detailRenderer: TestRenderer.ReactTestRenderer;
    act(() => {
      detailRenderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <JourneyDetailScreen
            navigation={navigation as never}
            route={
              {
                key: 'journey-detail-walk-rtl',
                name: 'JourneyDetail',
                params: { journeyId: 'walk' },
              } as never
            }
          />
        </ThemeProvider>,
      );
    });
    const taskTitle = detailRenderer!.root
      .findAllByType(Text)
      .find(node => node.props.children === '10 منٹ چہل قدمی کریں');
    expect(StyleSheet.flatten(taskTitle!.props.style)).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
    });
    expect(
      StyleSheet.flatten(taskTitle!.parent!.parent!.parent!.props.style),
    ).toMatchObject({ flexDirection: 'row-reverse' });
    act(() => detailRenderer!.unmount());
  });
});
