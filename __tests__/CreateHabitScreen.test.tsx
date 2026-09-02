import React from 'react';
import { Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TestRenderer, { act } from 'react-test-renderer';
import { CreateHabitScreen } from '../src/screens/today/CreateHabitScreen';
import { ThemeProvider } from '../src/context/ThemeContext';
import { useAppStore } from '../src/store/useAppStore';

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
    act(() => {
      useAppStore.setState({
        isHydrated: true,
        habits: [],
        persistenceError: undefined,
      });
    });
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
});
