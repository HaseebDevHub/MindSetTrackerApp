import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TestRenderer, { act } from 'react-test-renderer';
import { ThemeProvider } from '../src/context/ThemeContext';
import { setSelectedLanguage } from '../src/localization';
import { NotificationSettingsScreen } from '../src/screens/me/NotificationSettingsScreen';
import { useNotificationStore } from '../src/store/useNotificationStore';

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

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderScreen() {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <ThemeProvider initialMode="dark">
          <NotificationSettingsScreen
            navigation={{ goBack: jest.fn() } as never}
            route={{ key: 'Notifications', name: 'Notifications' }}
          />
        </ThemeProvider>
      </SafeAreaProvider>,
    );
  });
  return renderer!;
}

describe('Notification Settings', () => {
  let activeRenderer: TestRenderer.ReactTestRenderer | undefined;

  beforeEach(() => {
    act(() => {
      setSelectedLanguage('English');
      useNotificationStore.setState({
        settings: {
          version: 1,
          masterEnabled: true,
          globalRemindersEnabled: true,
          habitRemindersEnabled: true,
          times: {
            morning: '08:00',
            afternoon: '13:00',
            evening: '20:00',
          },
        },
        permissionStatus: 'authorized',
        exactAlarmEnabled: true,
        scheduledCount: 5,
        status: 'scheduled',
      });
    });
  });

  afterEach(() => {
    act(() => {
      activeRenderer?.unmount();
      activeRenderer = undefined;
      setSelectedLanguage('English');
    });
  });

  test('expands all three persisted global reminder times', () => {
    const renderer = renderScreen();
    activeRenderer = renderer;
    const reminderTime = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Reminder time',
    )[0];

    act(() => reminderTime.props.onPress());

    const text = renderer.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .flat(Infinity);
    expect(text).toEqual(
      expect.arrayContaining(['Morning', 'Afternoon', 'Evening']),
    );
  });

  test('shows a system-settings action after permission is denied', () => {
    act(() => useNotificationStore.setState({ permissionStatus: 'denied' }));
    const renderer = renderScreen();
    activeRenderer = renderer;

    expect(
      renderer.root.findAll(
        node => node.props.accessibilityLabel === 'OPEN NOTIFICATION SETTINGS',
      ).length,
    ).toBeGreaterThan(0);
  });

  test('right-aligns reminder rows in Urdu', () => {
    act(() => {
      setSelectedLanguage('Urdu');
    });
    const renderer = renderScreen();
    activeRenderer = renderer;
    const reminderTime = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'یاد دہانی کا وقت',
    )[0];
    act(() => reminderTime.props.onPress());

    const morning = renderer.root
      .findAllByType(Text)
      .find(node => node.props.children === 'صبح');
    expect(StyleSheet.flatten(morning!.props.style)).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
    });
  });
});
