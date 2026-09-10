import React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import notifee from '@notifee/react-native';
import { ThemeProvider } from '../src/context/ThemeContext';
import { setSelectedLanguage } from '../src/localization';
import { HabitAlertTypeSelector } from '../src/screens/today/components/HabitAlertTypeSelector';
import { alarmNative } from '../src/services/alarmNative';

afterEach(() => {
  jest.restoreAllMocks();
  act(() => {
    setSelectedLanguage('English');
  });
});

test.each(['dark', 'light'] as const)(
  'provides both choices with RTL copy and theme colors in %s',
  mode => {
    setSelectedLanguage('Urdu');
    const onChange = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode={mode}>
          <HabitAlertTypeSelector value="reminder" onChange={onChange} />
        </ThemeProvider>,
      );
    });
    const options = renderer!.root.findAll(
      node =>
        node.props.accessibilityRole === 'radio' &&
        typeof node.props.onPress === 'function',
    );
    expect(options).toHaveLength(2);
    expect(options[0].props.accessibilityState.selected).toBe(true);
    act(() => options[1].props.onPress());
    expect(onChange).toHaveBeenCalledWith('alarm');
    const label = renderer!.root
      .findAllByType(Text)
      .find(node => node.props.children === 'الرٹ کی قسم')!;
    expect(StyleSheet.flatten(label.props.style)).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
    });
    act(() => renderer.unmount());
  },
);

test('Android permission checks run only in Alarm mode and offer settings without changing selection', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  const check = jest
    .spyOn(alarmNative, 'canUseFullScreenIntent')
    .mockResolvedValue(false);
  const settings = jest
    .spyOn(alarmNative, 'openFullScreenSettings')
    .mockResolvedValue(undefined);
  const onChange = jest.fn();
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <ThemeProvider>
        <HabitAlertTypeSelector value="reminder" onChange={onChange} />
      </ThemeProvider>,
    );
  });
  expect(check).not.toHaveBeenCalled();
  await act(async () =>
    renderer.update(
      <ThemeProvider>
        <HabitAlertTypeSelector value="alarm" onChange={onChange} />
      </ThemeProvider>,
    ),
  );
  expect(check).toHaveBeenCalledTimes(1);
  const open = renderer!.root.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.onPress === 'function',
  )[0];
  await act(async () => open.props.onPress());
  expect(settings).toHaveBeenCalledTimes(1);
  expect(onChange).not.toHaveBeenCalled();
  act(() => renderer.unmount());
});

test('offers exact-alarm settings when precise timing is unavailable', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  jest.spyOn(alarmNative, 'canUseFullScreenIntent').mockResolvedValue(false);
  (notifee.getNotificationSettings as jest.Mock).mockResolvedValueOnce({
    authorizationStatus: 1,
    android: { alarm: 0 },
  });
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <ThemeProvider>
        <HabitAlertTypeSelector value="alarm" onChange={jest.fn()} />
      </ThemeProvider>,
    );
  });
  const open = renderer!.root.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.onPress === 'function',
  )[0];
  await act(async () => open.props.onPress());
  expect(notifee.openAlarmPermissionSettings).toHaveBeenCalled();
  act(() => renderer.unmount());
});
