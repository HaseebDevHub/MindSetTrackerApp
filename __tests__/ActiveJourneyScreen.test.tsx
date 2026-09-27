import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { StyleSheet, Text } from 'react-native';
import { ThemeProvider } from '../src/context/ThemeContext';
import { setSelectedLanguage } from '../src/localization';
import { ActiveJourneyScreen } from '../src/screens/journey/ActiveJourneyScreen';
import { useAppStore } from '../src/store/useAppStore';
import { toDateKey } from '../src/utils/dates';

jest.mock('@shopify/flash-list', () => ({
  FlashList: require('react-native').FlatList,
}));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
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

const originalToggle = useAppStore.getState().toggleJourneyTask;
const originalRemove = useAppStore.getState().removeActiveJourney;

describe('Active Journey screen', () => {
  afterEach(() => {
    act(() => {
      setSelectedLanguage('English');
    });
    useAppStore.setState({
      activeJourneys: [],
      toggleJourneyTask: originalToggle,
      removeActiveJourney: originalRemove,
    });
  });

  test.each(['dark', 'light'] as const)(
    'renders dynamic tasks and controls in %s mode',
    async mode => {
      const toggleJourneyTask = jest.fn(async () => true);
      const removeActiveJourney = jest.fn(async () => true);
      useAppStore.setState({
        isHydrated: true,
        activeJourneys: [
          {
            id: 'active-walk',
            journeyId: 'walk',
            startedDateKey: toDateKey(new Date()),
            isActive: true,
            taskCompletions: [],
          },
        ],
        toggleJourneyTask,
        removeActiveJourney,
      });
      const navigation = {
        goBack: jest.fn(),
        navigate: jest.fn(),
      };
      let renderer: TestRenderer.ReactTestRenderer;
      await act(async () => {
        renderer = TestRenderer.create(
          <ThemeProvider initialMode={mode}>
            <ActiveJourneyScreen
              navigation={navigation as never}
              route={
                {
                  key: 'active-walk-route',
                  name: 'ActiveJourney',
                  params: { activeJourneyId: 'active-walk' },
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
          'Add a little movement',
          'Stretch after walking',
        ]),
      );

      const firstTask = renderer!.root.findByProps({
        accessibilityLabel: 'Take a 10 minute walk, not completed',
      });
      await act(async () => firstTask.props.onPress());
      expect(toggleJourneyTask).toHaveBeenCalledWith(
        'active-walk',
        'walk-ten-minutes',
        toDateKey(new Date()),
      );

      act(() =>
        renderer!.root
          .findByProps({ accessibilityLabel: 'Journey options' })
          .props.onPress(),
      );
      const removeAction = renderer!.root.findByProps({
        accessibilityRole: 'menuitem',
      });
      await act(async () => removeAction.props.onPress());
      expect(removeActiveJourney).toHaveBeenCalledWith('active-walk');
      expect(navigation.navigate).toHaveBeenCalledWith(
        'JourneyHome',
        expect.objectContaining({
          toastMessage: 'Journey removed from active journeys',
        }),
      );
      act(() => renderer!.unmount());
    },
  );

  test('mirrors the active journey dashboard and menu for Urdu', async () => {
    setSelectedLanguage('Urdu');
    useAppStore.setState({
      isHydrated: true,
      activeJourneys: [
        {
          id: 'active-walk-rtl',
          journeyId: 'walk',
          startedDateKey: toDateKey(new Date()),
          isActive: true,
          taskCompletions: [],
        },
      ],
      toggleJourneyTask: jest.fn(async () => true),
      removeActiveJourney: jest.fn(async () => true),
    });
    const navigation = {
      goBack: jest.fn(),
      navigate: jest.fn(),
    };
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <ActiveJourneyScreen
            navigation={navigation as never}
            route={
              {
                key: 'active-walk-rtl-route',
                name: 'ActiveJourney',
                params: { activeJourneyId: 'active-walk-rtl' },
              } as never
            }
          />
        </ThemeProvider>,
      );
    });

    const task = renderer!.root.find(
      node =>
        node.props.accessibilityRole === 'checkbox' &&
        String(node.props.accessibilityLabel).startsWith(
          '10 منٹ چہل قدمی کریں',
        ),
    );
    const taskStyle =
      typeof task.props.style === 'function'
        ? task.props.style({ pressed: false })
        : task.props.style;
    expect(StyleSheet.flatten(taskStyle)).toMatchObject({
      flexDirection: 'row-reverse',
    });
    const taskTitle = renderer!.root
      .findAllByType(Text)
      .find(node => node.props.children === '10 منٹ چہل قدمی کریں');
    expect(StyleSheet.flatten(taskTitle!.props.style)).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
    });

    act(() =>
      renderer!.root
        .findByProps({ accessibilityLabel: 'سفر کے اختیارات' })
        .props.onPress(),
    );
    const menuTitle = renderer!.root
      .findAllByType(Text)
      .find(node => node.props.children === 'سفر کے اختیارات');
    expect(StyleSheet.flatten(menuTitle!.props.style)).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
    });
    const removeAction = renderer!.root.findByProps({
      accessibilityRole: 'menuitem',
    });
    expect(StyleSheet.flatten(removeAction.props.style)).toMatchObject({
      flexDirection: 'row-reverse',
    });
    act(() => renderer!.unmount());
  });
});

describe('progressive timeline interaction', () => {
  test('expands previews, disables future tasks, guards rapid taps and reports save errors', async () => {
    let finishSave: (saved: boolean) => void = () => undefined;
    const save = new Promise<boolean>(resolve => {
      finishSave = resolve;
    });
    const toggleJourneyTask = jest.fn(() => save);
    useAppStore.setState({
      activeJourneys: [
        {
          id: 'progressive',
          journeyId: 'morning',
          startedDateKey: toDateKey(new Date()),
          planVersion: 1,
          isActive: true,
          taskCompletions: [],
        },
      ],
      toggleJourneyTask,
    });
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="light">
          <ActiveJourneyScreen
            navigation={{ goBack: jest.fn(), navigate: jest.fn() } as never}
            route={{ params: { activeJourneyId: 'progressive' } } as never}
          />
        </ThemeProvider>,
      );
    });
    const controls = (role: string) =>
      renderer!.root.findAll(
        node =>
          node.props.accessibilityRole === role &&
          node.parent?.props.accessibilityRole !== role,
      );
    const dayButton = (day: number) =>
      controls('button').find(
        node =>
          node.props.accessibilityRole === 'button' &&
          String(node.props.accessibilityLabel).startsWith(`Day ${day},`),
      )!;
    expect(dayButton(1).props.accessibilityState.expanded).toBe(true);
    expect(dayButton(2).props.accessibilityState.expanded).toBe(false);
    act(() => dayButton(2).props.onPress());
    expect(dayButton(2).props.accessibilityState.expanded).toBe(true);
    let checkboxes = controls('checkbox');
    expect(checkboxes).toHaveLength(3);
    expect(
      checkboxes.map(node => node.props.accessibilityState.disabled),
    ).toEqual([false, true, true]);
    act(() => dayButton(2).props.onPress());
    expect(dayButton(2).props.accessibilityState.expanded).toBe(false);
    checkboxes = controls('checkbox');
    act(() => {
      checkboxes[0].props.onPress();
      checkboxes[0].props.onPress();
    });
    expect(toggleJourneyTask).toHaveBeenCalledTimes(1);
    const pendingTask = controls('checkbox')[0];
    expect(pendingTask.props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true,
      checked: false,
    });
    await act(async () => finishSave(false));
    const { ToastMessage } = require('../src/components/common/ToastMessage');
    expect(renderer!.root.findByType(ToastMessage).props).toMatchObject({
      visible: true,
      type: 'error',
    });
    act(() => useAppStore.setState({ activeJourneys: [] }));
    expect(
      renderer!.root
        .findAllByType(Text)
        .some(node => String(node.props.children).includes('unavailable')),
    ).toBe(true);
    act(() => renderer!.unmount());
    useAppStore.setState({ toggleJourneyTask: originalToggle });
  });
});
