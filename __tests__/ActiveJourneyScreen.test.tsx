import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { StyleSheet, Text } from 'react-native';
import { ThemeProvider } from '../src/context/ThemeContext';
import { setSelectedLanguage } from '../src/localization';
import { ActiveJourneyScreen } from '../src/screens/journey/ActiveJourneyScreen';
import { useAppStore } from '../src/store/useAppStore';
import { toDateKey } from '../src/utils/dates';

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
          'Reach your daily step goal',
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
