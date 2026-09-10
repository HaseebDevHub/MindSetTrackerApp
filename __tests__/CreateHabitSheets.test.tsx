import React from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { AppButton } from '../src/components/common/AppButton';
import { ThemeProvider } from '../src/context/ThemeContext';
import { setSelectedLanguage } from '../src/localization';
import { DateSheet } from '../src/screens/today/components/createHabit/DateSheet';
import { HabitTypeSelection } from '../src/screens/today/components/createHabit/HabitTypeSelection';
import { ScheduleSheet } from '../src/screens/today/components/createHabit/ScheduleSheet';
import { fromDateKey, toDateKey } from '../src/utils/dates';

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

afterEach(() => {
  setSelectedLanguage('English');
});

test.each(['dark', 'light'] as const)(
  'date list virtualizes the year and retains far-future selections in %s/RTL',
  mode => {
    setSelectedLanguage('Urdu');
    const save = jest.fn();
    const farFuture = `${new Date().getFullYear() + 3}-12-31`;
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode={mode}>
          <DateSheet
            visible
            title="Date"
            value={farFuture}
            onCancel={jest.fn()}
            onSave={save}
          />
        </ThemeProvider>,
      );
    });
    const list = renderer!.root.findByType(FlatList);
    expect(list.props.data.length).toBe(367);
    expect(toDateKey(list.props.data[list.props.initialScrollIndex])).toBe(
      farFuture,
    );
    expect(list.props.initialNumToRender).toBe(6);
    expect(renderer!.root.findAllByType(Pressable).length).toBeLessThan(30);
    expect(StyleSheet.flatten(list.props.style)).toMatchObject({
      transform: [{ scaleX: -1 }],
    });
    const next = list.props.data[1];
    act(() => list.props.renderItem({ item: next }).props.onPress());
    act(() => renderer!.root.findAllByType(AppButton)[1].props.onPress());
    expect(save).toHaveBeenCalledWith(toDateKey(next));
    act(() => renderer!.unmount());
  },
);

test('past dates remain selectable and an end date can be switched off', () => {
  const save = jest.fn();
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider>
        <DateSheet
          visible
          allowOff
          title="End"
          value="2020-01-01"
          onCancel={jest.fn()}
          onSave={save}
        />
      </ThemeProvider>,
    );
  });
  const list = renderer!.root.findByType(FlatList);
  expect(list.props.data[0]).toBeUndefined();
  expect(list.props.data[1]).toEqual(fromDateKey('2020-01-01'));
  act(() => list.props.renderItem({ item: undefined }).props.onPress());
  act(() => renderer!.root.findAllByType(AppButton)[1].props.onPress());
  expect(save).toHaveBeenCalledWith(undefined);
  act(() => renderer!.unmount());
});

test('the type picker exposes busy feedback and disables choices while opening', () => {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider>
        <HabitTypeSelection
          initialType="REGULAR"
          loading
          onContinue={jest.fn()}
          onBack={jest.fn()}
        />
      </ThemeProvider>,
    );
  });
  expect(renderer!.root.findByType(AppButton).props.loading).toBe(true);
  const tabs = renderer!.root.findAll(
    node =>
      node.props.accessibilityRole === 'tab' &&
      typeof node.props.onPress === 'function',
  );
  expect(tabs).toHaveLength(3);
  tabs.forEach(tab => expect(tab.props.disabled).toBe(true));
  act(() => renderer!.unmount());
});

test('schedule draft survives parent rerenders and rapid weekday toggles use current state', () => {
  const save = jest.fn();
  const render = () => (
    <ThemeProvider>
      <ScheduleSheet
        visible
        value={{ mode: 'SPECIFIC_DAYS', weekdays: [1], quota: 3 }}
        onCancel={jest.fn()}
        onSave={save}
      />
    </ThemeProvider>
  );
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(render());
  });
  const monday = renderer!.root.findAll(
    node =>
      node.props.accessibilityLabel === 'Monday' &&
      typeof node.props.onPress === 'function',
  )[0];
  act(() => {
    monday.props.onPress();
    monday.props.onPress();
  });
  const tuesday = renderer!.root.findAll(
    node =>
      node.props.accessibilityLabel === 'Tuesday' &&
      typeof node.props.onPress === 'function',
  )[0];
  act(() => tuesday.props.onPress());
  act(() => renderer!.update(render()));
  act(() => renderer!.root.findAllByType(AppButton)[1].props.onPress());
  expect(save).toHaveBeenCalledWith({
    mode: 'SPECIFIC_DAYS',
    weekdays: [1, 2],
    quota: 3,
  });
  act(() => renderer!.unmount());
});
