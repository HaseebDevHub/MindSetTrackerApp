import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import {
  Check,
  ChevronLeft,
  CloudSun,
  ListChecks,
  Moon,
  Plus,
  Sun,
} from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import {
  HorizontalListSeparator,
  VerticalListSeparator,
} from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { HabitCard } from '../../components/habit/HabitCard';
import type { HabitMenuAnchor } from '../../components/habit/HabitCard';
import { spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import type {
  HabitItem,
  TodayFilter,
  TodayStackParamList,
} from '../../types/models';
import {
  addDays,
  formatShortDate,
  fromDateKey,
  toDateKey,
} from '../../utils/dates';
import {
  isHabitVisibleForTodayFilter,
  partitionHabitsByCompletion,
} from '../../utils/habits';
import { HabitActionModals } from './components/HabitActionModals';
import useStyles from './TodayScreenStyle';

type Props = NativeStackScreenProps<TodayStackParamList, 'TodayHome'>;
const filters: { key: TodayFilter; icon: typeof Sun }[] = [
  { key: 'ALL', icon: ListChecks },
  { key: 'MORNING', icon: Sun },
  { key: 'AFTERNOON', icon: CloudSun },
  { key: 'EVENING', icon: Moon },
];
const DATE_RANGE_DAYS = 365 * 10;

type HabitListItem =
  | { type: 'habit'; habit: HabitItem }
  | { type: 'finishedHeader'; id: 'finished' };

export function TodayScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const selectedDate = useAppStore(s => s.selectedDate);
  const setDate = useAppStore(s => s.setSelectedDate);
  const filter = useAppStore(s => s.selectedFilter);
  const setFilter = useAppStore(s => s.setSelectedFilter);
  const habits = useAppStore(s => s.habits);
  const toggle = useAppStore(s => s.toggleHabit);
  const update = useAppStore(s => s.updateHabit);
  const [habitMenu, setHabitMenu] = useState<{
    habit: HabitItem;
    anchor: HabitMenuAnchor;
  }>();
  const [noteHabit, setNoteHabit] = useState<HabitItem>();
  const [note, setNote] = useState('');
  const todayDate = useRef(toDateKey(new Date())).current;
  const dateListRef = useRef<FlatList<Date>>(null);
  const todayDateRef = useRef(todayDate);
  const returnAnimationTimeout = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);
  const isReturningToTodayRef = useRef(false);
  const [isTodayInViewport, setIsTodayInViewport] = useState(
    selectedDate === todayDate,
  );
  const [isReturningToToday, setIsReturningToToday] = useState(false);
  const selected = fromDateKey(selectedDate);
  const dateRangeCenter = useRef(todayDate).current;
  const dateCellWidth = (width - spacing.small * 2) / 7;
  const dates = useMemo(() => {
    const center = fromDateKey(dateRangeCenter);
    return Array.from({ length: DATE_RANGE_DAYS * 2 + 1 }, (_, index) =>
      addDays(center, index - DATE_RANGE_DAYS),
    );
  }, [dateRangeCenter]);
  const todayIndex = DATE_RANGE_DAYS;
  const initialScrollIndex = useRef(
    Math.max(0, dates.findIndex(date => toDateKey(date) === selectedDate) - 3),
  ).current;
  const isTodayButtonVisible =
    isReturningToToday || selectedDate !== todayDate || !isTodayInViewport;
  const todayButtonProgress = useRef(
    new Animated.Value(isTodayButtonVisible ? 1 : 0),
  ).current;
  const visible = useMemo(
    () => habits.filter(h => isHabitVisibleForTodayFilter(h, filter)),
    [filter, habits],
  );
  const { active: activeHabits, finished: finishedHabits } = useMemo(
    () => partitionHabitsByCompletion(visible, selectedDate),
    [selectedDate, visible],
  );
  const habitListItems = useMemo<HabitListItem[]>(
    () => [
      ...activeHabits.map(habit => ({ type: 'habit' as const, habit })),
      ...(finishedHabits.length
        ? [
            { type: 'finishedHeader' as const, id: 'finished' as const },
            ...finishedHabits.map(habit => ({
              type: 'habit' as const,
              habit,
            })),
          ]
        : []),
    ],
    [activeHabits, finishedHabits],
  );

  useEffect(() => {
    const animation = Animated.timing(todayButtonProgress, {
      toValue: isTodayButtonVisible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    });
    animation.start();

    return () => animation.stop();
  }, [isTodayButtonVisible, todayButtonProgress]);

  useEffect(
    () => () => {
      if (returnAnimationTimeout.current) {
        clearTimeout(returnAnimationTimeout.current);
      }
    },
    [],
  );

  const onViewableDatesChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<Date>[] }) => {
      const todayIsVisible = viewableItems.some(
        ({ item }) => item != null && toDateKey(item) === todayDateRef.current,
      );
      setIsTodayInViewport(current =>
        current === todayIsVisible ? current : todayIsVisible,
      );
    },
  ).current;
  const dateViewabilityConfig = useRef({
    itemVisiblePercentThreshold: 1,
  }).current;

  const finishReturningToToday = useCallback(() => {
    if (!isReturningToTodayRef.current) {
      return;
    }

    isReturningToTodayRef.current = false;
    setIsReturningToToday(false);
    if (returnAnimationTimeout.current) {
      clearTimeout(returnAnimationTimeout.current);
      returnAnimationTimeout.current = undefined;
    }
  }, []);

  const returnToToday = useCallback(() => {
    isReturningToTodayRef.current = true;
    setIsReturningToToday(true);
    setDate(todayDate);
    dateListRef.current?.scrollToIndex({
      animated: true,
      index: todayIndex,
      viewPosition: 0.5,
    });

    // Some platforms do not emit a momentum event for very short scrolls.
    returnAnimationTimeout.current = setTimeout(finishReturningToToday, 500);
  }, [finishReturningToToday, setDate, todayDate, todayIndex]);

  const renderDate = useCallback(
    ({ item: date }: { item: Date }) => {
      const key = toDateKey(date);
      const active = key === selectedDate;
      return (
        <Pressable
          accessibilityLabel={date.toDateString()}
          onPress={() => setDate(key)}
          style={[
            styles.dateCell,
            styles.dateListCell,
            { width: dateCellWidth },
            active && styles.dateActive,
          ]}
        >
          <Text style={[styles.dayName, active && styles.activeText]}>
            {date
              .toLocaleDateString('en-US', { weekday: 'short' })
              .toUpperCase()}
          </Text>
          <Text style={[styles.dayNumber, active && styles.activeText]}>
            {date.getDate()}
          </Text>
        </Pressable>
      );
    },
    [dateCellWidth, selectedDate, setDate, styles],
  );
  const renderFilter = useCallback(
    ({ item: { key, icon: Icon } }: { item: (typeof filters)[number] }) => {
      const active = filter === key;
      return (
        <Pressable
          onPress={() => setFilter(key)}
          style={[styles.filter, active && styles.filterActive]}
        >
          <Icon
            color={active ? colors.yellow : colors.textSecondary}
            size={17}
          />
          <Text style={[styles.filterText, active && styles.accentActiveText]}>
            {key}
          </Text>
        </Pressable>
      );
    },
    [colors, filter, setFilter, styles],
  );
  const renderHabit = useCallback(
    (habit: HabitItem) => (
      <HabitCard
        habit={habit}
        completed={habit.completedDates.includes(selectedDate)}
        onToggle={() => toggle(habit.id, selectedDate)}
        onMenu={anchor => setHabitMenu({ habit, anchor })}
        onPress={() =>
          navigation.navigate('HabitDetail', { habitId: habit.id })
        }
      />
    ),
    [navigation, selectedDate, toggle],
  );
  const renderHabitListItem = useCallback(
    ({ item }: { item: HabitListItem }) =>
      item.type === 'finishedHeader' ? (
        <View style={styles.finishedSectionRow}>
          <Text style={styles.finishedSectionTitle}>FINISHED</Text>
          <Text style={styles.count}>{finishedHabits.length}</Text>
        </View>
      ) : (
        renderHabit(item.habit)
      ),
    [finishedHabits.length, renderHabit, styles],
  );
  const listHeader = (
    <>
      <FlashList
        horizontal
        data={filters}
        renderItem={renderFilter}
        keyExtractor={item => item.key}
        ItemSeparatorComponent={HorizontalListSeparator}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={styles.filters}
      />
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>{filter}</Text>
        <Text style={styles.count}>
          {finishedHabits.length}/{visible.length} finished
        </Text>
      </View>
    </>
  );
  return (
    <ScreenContainer padded={false}>
      <View style={styles.headerPad}>
        <View style={styles.todayTop}>
          <View>
            <Text style={styles.eyebrow}>
              {selectedDate === todayDate
                ? 'TODAY'
                : selected
                    .toLocaleDateString('en-US', { weekday: 'long' })
                    .toUpperCase()}
            </Text>
            <Text style={styles.dateTitle}>{formatShortDate(selected)}</Text>
          </View>
          <Pressable
            accessibilityLabel="Create a new habit"
            onPress={() => navigation.navigate('CreateHabit')}
            style={styles.plus}
          >
            <Plus color={colors.onPrimary} size={24} />
          </Pressable>
        </View>
      </View>
      <FlatList
        ref={dateListRef}
        horizontal
        data={dates}
        renderItem={renderDate}
        keyExtractor={date => toDateKey(date)}
        extraData={selectedDate}
        initialScrollIndex={initialScrollIndex}
        getItemLayout={(_, index) => ({
          length: dateCellWidth,
          offset: dateCellWidth * index,
          index,
        })}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableDatesChanged}
        viewabilityConfig={dateViewabilityConfig}
        onMomentumScrollEnd={finishReturningToToday}
        onScrollAnimationEnd={finishReturningToToday}
        style={styles.dateStrip}
        contentContainerStyle={styles.dateStripContent}
      />
      <FlashList
        data={habitListItems}
        renderItem={renderHabitListItem}
        keyExtractor={item =>
          item.type === 'finishedHeader' ? item.id : item.habit.id
        }
        getItemType={item => item.type}
        ItemSeparatorComponent={VerticalListSeparator}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Check color={colors.muted} size={38} />
            <Text style={styles.emptyTitle}>A clear schedule</Text>
            <Text style={styles.emptyText}>
              No habits match this time of day yet.
            </Text>
          </View>
        }
        ListFooterComponent={
          <AppButton
            title="CREATE A NEW HABIT"
            variant="secondary"
            onPress={() => navigation.navigate('CreateHabit')}
            style={styles.create}
          />
        }
        style={styles.habitList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
      <Animated.View
        accessibilityElementsHidden={!isTodayButtonVisible}
        importantForAccessibility={
          isTodayButtonVisible ? 'auto' : 'no-hide-descendants'
        }
        pointerEvents={isTodayButtonVisible ? 'auto' : 'none'}
        style={[
          styles.todayButtonContainer,
          {
            opacity: todayButtonProgress,
            transform: [
              {
                scale: todayButtonProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Return to today"
          accessibilityRole="button"
          onPress={returnToToday}
          style={({ pressed }) => [
            styles.todayButton,
            pressed && styles.todayButtonPressed,
          ]}
        >
          <ChevronLeft color={colors.onPrimary} size={18} strokeWidth={2.5} />
          <Text style={styles.todayButtonText}>Today</Text>
        </Pressable>
      </Animated.View>
      <HabitActionModals
        menuHabit={habitMenu?.habit}
        menuAnchor={habitMenu?.anchor}
        noteHabit={noteHabit}
        note={note}
        selectedDate={selectedDate}
        onCloseMenu={() => setHabitMenu(undefined)}
        onCloseNote={() => setNoteHabit(undefined)}
        onEdit={habit => {
          navigation.navigate('CreateHabit', { habitId: habit.id });
          setHabitMenu(undefined);
        }}
        onOpenNote={habit => {
          setHabitMenu(undefined);
          setNoteHabit(habit);
          setNote(habit.note ?? '');
        }}
        onSaveNote={(habit, value) => {
          update(habit.id, { note: value.trim() });
          setNoteHabit(undefined);
        }}
        onSetNote={setNote}
        onUndo={habit => {
          toggle(habit.id, selectedDate);
          setHabitMenu(undefined);
        }}
      />
    </ScreenContainer>
  );
}
