import React from 'react';
import { Modal, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TestRenderer, { act } from 'react-test-renderer';
import { CreateHabitScreen } from '../src/screens/today/CreateHabitScreen';
import { ThemeProvider } from '../src/context/ThemeContext';
import { useAppStore } from '../src/store/useAppStore';
import { setSelectedLanguage, t } from '../src/localization';
import { HabitAlertTypeSelector } from '../src/screens/today/components/HabitAlertTypeSelector';
import { AppHeader } from '../src/components/common/AppHeader';
import { AppButton } from '../src/components/common/AppButton';
import { DateSheet } from '../src/screens/today/components/createHabit/DateSheet';
import { ScheduleSheet } from '../src/screens/today/components/createHabit/ScheduleSheet';
import { IconSheet } from '../src/screens/today/components/createHabit/IconSheet';

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

function renderCreateHabit(
  goBack = jest.fn(),
  habitId?: string,
  popTo = jest.fn(),
) {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <ThemeProvider initialMode="dark">
          <CreateHabitScreen
            navigation={{ goBack, popTo } as never}
            route={{
              key: 'CreateHabit',
              name: 'CreateHabit',
              params: habitId ? { habitId } : undefined,
            }}
          />
        </ThemeProvider>
      </SafeAreaProvider>,
    );
  });
  return { renderer: renderer!, goBack, popTo };
}

function pressByLabel(renderer: TestRenderer.ReactTestRenderer, label: string) {
  const control = renderer.root.findAll(
    item => item.props.accessibilityLabel === label,
  );
  expect(control[0]).toBeDefined();
  act(() => control[0].props.onPress());
}

describe('Create Habit custom workflow', () => {
  beforeEach(() => {
    setSelectedLanguage('English');
    act(() => {
      useAppStore.setState({
        isHydrated: true,
        habits: [],
        persistenceError: undefined,
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    act(() => {
      setSelectedLanguage('English');
    });
  });

  test('rerenders the complete entry flow in the selected language', () => {
    setSelectedLanguage('Spanish');
    const { renderer } = renderCreateHabit();
    const copy = renderer.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .flat(Infinity);

    expect(copy).toContain('Crear un nuevo hábito');
    expect(copy).toContain('NEGATIVO');
    expect(copy).toContain('＋  CREA EL TUYO');
    act(() => renderer.unmount());
  });

  test('mirrors creation copy and input direction for Urdu', () => {
    setSelectedLanguage('Urdu');
    const { renderer } = renderCreateHabit();
    const createOwn = renderer.root.findAll(
      item => item.props.accessibilityLabel === '＋  اپنی عادت بنائیں',
    )[0];
    expect(createOwn).toBeDefined();
    act(() => createOwn.props.onPress());

    const input = renderer.root.findByType(TextInput);
    expect(StyleSheet.flatten(input.props.style)).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
    });
    const inputLabel = renderer.root
      .findAllByType(Text)
      .find(node => node.props.children === 'عادت کا نام');
    expect(StyleSheet.flatten(inputLabel!.props.style)).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
    });

    act(() => renderer.unmount());
  });

  test('offers all three types without rendering the omitted presets list', () => {
    const { renderer } = renderCreateHabit();
    const copy = renderer.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .flat(Infinity)
      .filter(value => typeof value === 'string')
      .join(' ');

    expect(copy).toContain('REGULAR');
    expect(copy).toContain('NEGATIVE');
    expect(copy).toContain('ONE-TIME');
    expect(copy).toContain('CREATE YOUR OWN');
    expect(copy).not.toContain('CHOOSE FROM PRESETS');
    expect(copy).not.toContain('Habits in trend');

    act(() => renderer.unmount());
  });

  test('entering and typing in the form do not mount hidden sheets or format their dates', () => {
    const { renderer } = renderCreateHabit();
    const format = jest.spyOn(Date.prototype, 'toLocaleDateString');
    pressByLabel(renderer, '＋  CREATE YOUR OWN');
    act(() => renderer.root.findByType(TextInput).props.onChangeText('Walk'));
    expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
    expect(renderer.root.findAllByType(DateSheet)).toHaveLength(0);
    expect(renderer.root.findAllByType(ScheduleSheet)).toHaveLength(0);
    expect(format).not.toHaveBeenCalled();
    act(() => renderer.unmount());
  });

  test('icon sheets mount on demand and cancel/reopen restores the saved value', () => {
    const { renderer } = renderCreateHabit();
    pressByLabel(renderer, '＋  CREATE YOUR OWN');
    pressByLabel(renderer, t('habit_choose_icon'));
    const original = renderer.root.findByType(IconSheet).props.value;
    const options = renderer.root.findAll(
      node =>
        node.props.accessibilityRole === 'radio' &&
        typeof node.props.accessibilityLabel === 'string' &&
        typeof node.props.onPress === 'function',
    );
    act(() => options[1].props.onPress());
    act(() => renderer.root.findByType(IconSheet).props.onCancel());
    expect(renderer.root.findAllByType(IconSheet)).toHaveLength(0);
    pressByLabel(renderer, t('habit_choose_icon'));
    expect(renderer.root.findByType(IconSheet).props.value).toBe(original);
    act(() => renderer.root.findByType(IconSheet).props.onSave('BookOpen'));
    pressByLabel(renderer, t('habit_choose_icon'));
    expect(renderer.root.findByType(IconSheet).props.value).toBe('BookOpen');
    act(() => renderer.unmount());
  });

  test('rapid selections immediately followed by continue use the last tapped type', () => {
    const { renderer } = renderCreateHabit();
    const tabs = renderer.root.findAll(
      node =>
        node.props.accessibilityRole === 'tab' &&
        typeof node.props.onPress === 'function',
    );
    const create = renderer.root.findByType(AppButton);
    act(() => {
      tabs[1].props.onPress();
      tabs[2].props.onPress();
      tabs[0].props.onPress();
      tabs[1].props.onPress();
      create.props.onPress();
    });
    expect(
      renderer.root
        .findAllByType(TextInput)
        .some(node => node.props.placeholder === 'e.g. Avoid smoking'),
    ).toBe(true);
    expect(useAppStore.getState().habits).toHaveLength(0);
    act(() => renderer.unmount());
  });

  test.each(['English', 'Urdu'] as const)(
    'only the last selected tab stays active in %s',
    language => {
      setSelectedLanguage(language);
      const { renderer } = renderCreateHabit();
      const tabs = () =>
        renderer.root.findAll(
          node =>
            node.props.accessibilityRole === 'tab' &&
            typeof node.props.onPress === 'function',
        );
      for (const index of [1, 2, 0, 2, 2, 1, 0]) {
        act(() => tabs()[index].props.onPress());
        expect(
          tabs().map(node => node.props.accessibilityState.selected),
        ).toEqual([0, 1, 2].map(candidate => candidate === index));
      }
      act(() => renderer.unmount());
    },
  );

  test('reselecting the current type preserves the entered form draft', () => {
    const { renderer } = renderCreateHabit();
    pressByLabel(renderer, 'NEGATIVE');
    pressByLabel(renderer, '＋  CREATE YOUR OWN');
    const inputs = renderer.root.findAllByType(TextInput);
    act(() => {
      inputs[0].props.onChangeText('Avoid sweets');
      inputs[1].props.onChangeText('Feel healthier');
    });
    act(() => renderer.root.findByType(AppHeader).props.onBack());
    pressByLabel(renderer, 'NEGATIVE');
    pressByLabel(renderer, 'NEGATIVE');
    pressByLabel(renderer, '＋  CREATE YOUR OWN');
    expect(
      renderer.root.findAllByType(TextInput).map(node => node.props.value),
    ).toEqual(['Avoid sweets', 'Feel healthier']);
    act(() => renderer.unmount());
  });

  test.each([
    ['REGULAR', 'NEGATIVE'],
    ['REGULAR', 'ONE_TIME'],
    ['NEGATIVE', 'REGULAR'],
    ['NEGATIVE', 'ONE_TIME'],
    ['ONE_TIME', 'REGULAR'],
    ['ONE_TIME', 'NEGATIVE'],
  ] as const)(
    'switching %s to %s saves the correct type and schedule',
    async (from, to) => {
      const labels = {
        REGULAR: 'REGULAR',
        NEGATIVE: 'NEGATIVE',
        ONE_TIME: 'ONE-TIME TODO',
      };
      const { renderer } = renderCreateHabit();
      pressByLabel(renderer, labels[from]);
      pressByLabel(renderer, '＋  CREATE YOUR OWN');
      act(() =>
        renderer.root
          .findAllByType(TextInput)[0]
          .props.onChangeText('My habit'),
      );
      act(() => renderer.root.findByType(AppHeader).props.onBack());
      pressByLabel(renderer, labels[to]);
      pressByLabel(renderer, '＋  CREATE YOUR OWN');
      const save = renderer.root
        .findAllByType(AppButton)
        .find(node => node.props.title === t('common_save'))!;
      await act(async () => save.props.onPress());
      expect(useAppStore.getState().habits[0]).toMatchObject({
        title: 'My habit',
        habitType: to,
        scheduleMode: to === 'ONE_TIME' ? 'ONE_TIME' : 'EVERYDAY',
        goalMode: 'OFF',
      });
      act(() => renderer.unmount());
    },
  );

  test('creates a negative habit once after a rapid double save', async () => {
    const { renderer, goBack, popTo } = renderCreateHabit();
    pressByLabel(renderer, 'NEGATIVE');
    pressByLabel(renderer, '＋  CREATE YOUR OWN');

    const input = renderer.root
      .findAllByType(TextInput)
      .find(item => item.props.placeholder === 'e.g. Avoid smoking')!;
    act(() => input.props.onChangeText('  No smoking  '));
    const save = renderer.root.findAll(
      item => item.props.accessibilityLabel === 'SAVE',
    )[0];
    expect(save).toBeDefined();

    await act(async () => {
      const first = save!.props.onPress();
      const second = save!.props.onPress();
      await Promise.all([first, second]);
    });

    expect(useAppStore.getState().habits).toHaveLength(1);
    expect(useAppStore.getState().habits[0]).toMatchObject({
      title: 'No smoking',
      habitType: 'NEGATIVE',
      scheduleMode: 'EVERYDAY',
      goalMode: 'OFF',
      reminderType: 'reminder',
    });
    expect(goBack).not.toHaveBeenCalled();
    expect(popTo).toHaveBeenCalledWith(
      'TodayHome',
      expect.objectContaining({
        toastMessage: 'Habit created successfully',
        toastRequestId: expect.any(Number),
      }),
    );
    act(() => renderer.unmount());
  });

  test('switches one-time creation to an exact-date schedule', async () => {
    const { renderer } = renderCreateHabit();
    pressByLabel(renderer, 'ONE-TIME TODO');
    pressByLabel(renderer, '＋  CREATE YOUR OWN');
    act(() =>
      renderer.root
        .findByType(TextInput)
        .props.onChangeText('Book appointment'),
    );
    const save = renderer.root.findAll(
      item => item.props.accessibilityLabel === 'SAVE',
    )[0];
    await act(async () => save!.props.onPress());

    expect(useAppStore.getState().habits[0]).toMatchObject({
      habitType: 'ONE_TIME',
      scheduleMode: 'ONE_TIME',
    });
    expect(useAppStore.getState().habits[0].targetDate).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
    act(() => renderer.unmount());
  });

  test('shows delete and pause actions only from the edit header menu', () => {
    useAppStore.setState({
      habits: [
        {
          id: 'editable-habit',
          title: 'Read a book',
          timeOfDay: 'EVENING',
          completedDates: [],
          streakCount: 0,
          iconName: 'BookOpen',
          createdAt: '2026-09-01',
        },
      ],
    });
    const { renderer } = renderCreateHabit(jest.fn(), 'editable-habit');

    pressByLabel(renderer, 'Open habit actions');

    expect(
      renderer.root.findAll(
        node => node.props.accessibilityLabel === 'Pause and archive habit',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      renderer.root.findAll(
        node => node.props.accessibilityLabel === 'Delete habit',
      ).length,
    ).toBeGreaterThan(0);

    act(() => renderer.unmount());
  });

  test('edits the persisted alarm type and saves switching back to Reminder', async () => {
    useAppStore.setState({
      habits: [
        {
          id: 'edit-alarm',
          title: 'Walk',
          timeOfDay: 'ANYTIME',
          iconName: 'Footprints',
          completedDates: [],
          streakCount: 0,
          reminderEnabled: true,
          reminderType: 'alarm',
          reminderTime: '09:00',
        },
      ],
    });
    const { renderer } = renderCreateHabit(jest.fn(), 'edit-alarm');
    expect(renderer.root.findByType(HabitAlertTypeSelector).props.value).toBe(
      'alarm',
    );
    act(() =>
      renderer.root
        .findByType(HabitAlertTypeSelector)
        .props.onChange('reminder'),
    );
    const save = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'SAVE CHANGES',
    )[0];
    await act(async () => save.props.onPress());
    expect(useAppStore.getState().habits[0].reminderType).toBe('reminder');
    act(() => renderer.unmount());
  });
});
