import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { FlashList } from '@shopify/flash-list';
import { useShallow } from 'zustand/react/shallow';
import {
  Check,
  ChevronLeft,
  Clock3,
  CloudSun,
  ListChecks,
  Moon,
  Plus,
  Sun,
} from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import { CelebrationModal } from '../../components/common/CelebrationModal';
import {
  HorizontalListSeparator,
  VerticalListSeparator,
} from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ToastMessage } from '../../components/common/ToastMessage';
import { HabitCard } from '../../components/habit/HabitCard';
import type { HabitMenuAnchor } from '../../components/habit/HabitCard';
import { spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import type {
  HabitItem,
  MainTabParamList,
  TodayFilter,
  TodayStackParamList,
} from '../../types/models';
import {
  addDays,
  formatShortDate,
  fromDateKey,
  getDateStatus,
  getRelativeDateLabel,
  toDateKey,
} from '../../utils/dates';
import {
  getDailyProgress,
  hasHabitRelapseOnDate,
  isHabitCompleteOnDate,
  isLongTermHabit,
} from '../../utils/habitAnalytics';
import { normalizeHabitType } from '../../utils/habitSchedule';
import {
  isHabitVisibleForTodayFilter,
  partitionHabitsByCompletion,
} from '../../utils/habits';
import { HabitActionModals } from './components/HabitActionModals';
import useStyles from './TodayScreenStyle';

type Props = NativeStackScreenProps<TodayStackParamList, 'TodayHome'>;
const filters: { key: TodayFilter; icon: typeof Sun }[] = [
  { key: 'ALL', icon: ListChecks },
  { key: 'ANYTIME', icon: Clock3 },
  { key: 'MORNING', icon: Sun },
  { key: 'AFTERNOON', icon: CloudSun },
  { key: 'EVENING', icon: Moon },
];
const DATE_RANGE_DAYS = 365 * 10;

type HabitListItem =
  | { type: 'habit'; habit: HabitItem }
  | { type: 'finishedHeader'; id: 'finished' }
  | { type: 'longTermHeader'; id: 'long-term' }
  | { type: 'skeleton'; id: string };

const filterSkeletonItems: HabitListItem[] = Array.from(
  { length: 3 },
  (_, index) => ({ type: 'skeleton', id: `filter-skeleton-${index}` }),
);

const keyByFilter = (item: (typeof filters)[number]) => item.key;
const keyByHabitListItem = (item: HabitListItem) =>
  item.type === 'habit' ? item.habit.id : item.id;
const getHabitListItemType = (item: HabitListItem) => item.type;

export function TodayScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const {
    selectedDate,
    storedFilter,
    habits,
    celebration,
    setDate,
    setFilter,
    toggle,
    update,
    dismissCelebration,
    weekStartsOn,
  } = useAppStore(
    useShallow(state => ({
      selectedDate: state.selectedDate,
      storedFilter: state.selectedFilter,
      habits: state.habits,
      celebration: state.celebration,
      setDate: state.setSelectedDate,
      setFilter: state.setSelectedFilter,
      toggle: state.toggleHabit,
      update: state.updateHabit,
      dismissCelebration: state.dismissCelebration,
      weekStartsOn: state.weekStartsOn,
    })),
  );
  const [activeFilter, setActiveFilter] = useState(storedFilter);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const filterFrameRef = useRef<number | undefined>(undefined);
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
  const relativeDateLabel = getRelativeDateLabel(selected);
  const showRelativeDateLabel =
    relativeDateLabel === 'YESTERDAY' ||
    relativeDateLabel === 'TODAY' ||
    relativeDateLabel === 'TOMORROW';
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
    () =>
      habits.filter(habit =>
        isHabitVisibleForTodayFilter(habit, storedFilter, selectedDate),
      ),
    [habits, selectedDate, storedFilter],
  );
  const selectedProgress = useMemo(
    () => getDailyProgress(habits, selectedDate),
    [habits, selectedDate],
  );
  const standardHabits = useMemo(
    () => visible.filter(habit => !isLongTermHabit(habit)),
    [visible],
  );
  const longTermHabits = useMemo(
    () => visible.filter(isLongTermHabit),
    [visible],
  );
  const { active: activeHabits, finished: finishedHabits } = useMemo(
    () => partitionHabitsByCompletion(standardHabits, selectedDate),
    [selectedDate, standardHabits],
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
      ...(longTermHabits.length
        ? [
            { type: 'longTermHeader' as const, id: 'long-term' as const },
            ...longTermHabits.map(habit => ({
              type: 'habit' as const,
              habit,
            })),
          ]
        : []),
    ],
    [activeHabits, finishedHabits, longTermHabits],
  );
  const displayedHabitListItems = isFilterLoading
    ? filterSkeletonItems
    : habitListItems;

  useEffect(() => {
    setActiveFilter(storedFilter);
  }, [storedFilter]);

  useEffect(() => {
    const selectedIndex = dates.findIndex(
      date => toDateKey(date) === selectedDate,
    );
    if (selectedIndex < 0) return undefined;

    const frame = requestAnimationFrame(() => {
      dateListRef.current?.scrollToIndex({
        animated: true,
        index: selectedIndex,
        viewPosition: 0.5,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [dates, route.params?.dateFocusRequestId, selectedDate]);

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
      if (filterFrameRef.current !== undefined) {
        cancelAnimationFrame(filterFrameRef.current);
      }
    },
    [],
  );

  const selectFilter = useCallback(
    (nextFilter: TodayFilter) => {
      if (nextFilter === activeFilter && nextFilter === storedFilter) return;

      setActiveFilter(nextFilter);
      setIsFilterLoading(true);
      if (filterFrameRef.current !== undefined) {
        cancelAnimationFrame(filterFrameRef.current);
      }
      filterFrameRef.current = requestAnimationFrame(() => {
        filterFrameRef.current = undefined;
        setFilter(nextFilter);
        setIsFilterLoading(false);
      });
    },
    [activeFilter, setFilter, storedFilter],
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
      const progress = getDailyProgress(habits, key);
      return (
        <Pressable
          accessibilityLabel={date.toDateString()}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
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
          <View
            style={[
              styles.dateNumberCircle,
              active && styles.dateNumberCircleActive,
            ]}
          >
            <Text
              style={[
                styles.dayNumber,
                active && styles.activeDayNumber,
              ]}
            >
              {date.getDate()}
            </Text>
          </View>
          <View style={styles.dateProgressTrack}>
            <View
              style={[
                styles.dateProgressFill,
                progress.isPerfect && styles.dateProgressPerfect,
                { width: 18 * (progress.percentage / 100) },
              ]}
            />
          </View>
        </Pressable>
      );
    },
    [dateCellWidth, habits, selectedDate, setDate, styles],
  );
  const renderFilter = useCallback(
    ({ item: { key, icon: Icon } }: { item: (typeof filters)[number] }) => {
      const active = activeFilter === key;
      return (
        <Pressable
          onPress={() => selectFilter(key)}
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
    [activeFilter, colors, selectFilter, styles],
  );
  const openHabitMenu = useCallback(
    (habit: HabitItem, anchor: HabitMenuAnchor) =>
      setHabitMenu({ habit, anchor }),
    [],
  );
  const openHabit = useCallback(
    (habitId: string) => navigation.navigate('HabitDetail', { habitId }),
    [navigation],
  );
  const renderHabit = useCallback(
    (habit: HabitItem) => {
      const completed = isHabitCompleteOnDate(habit, selectedDate);
      const toggleSelectedHabit = (habitId: string, date: string) => {
        if (
          normalizeHabitType(habit.habitType) === 'NEGATIVE' &&
          !hasHabitRelapseOnDate(habit, date)
        ) {
          Alert.alert(
            'Record a relapse?',
            `This will mark ${habit.title} as not avoided on this date.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Record relapse',
                style: 'destructive',
                onPress: () => {
                  toggle(habitId, date).catch(() => undefined);
                },
              },
            ],
          );
          return;
        }
        toggle(habitId, date).catch(() => undefined);
      };
      return (
        <HabitCard
          habit={habit}
          completed={completed}
          completionDisabled={getDateStatus(selectedDate) === 'future'}
          selectedDate={selectedDate}
          weekStartsOn={weekStartsOn}
          onToggle={toggleSelectedHabit}
          onMenu={openHabitMenu}
          onPress={openHabit}
        />
      );
    },
    [openHabit, openHabitMenu, selectedDate, toggle, weekStartsOn],
  );
  const renderHabitListItem = useCallback(
    ({ item }: { item: HabitListItem }) =>
      item.type === 'skeleton' ? (
        <View style={styles.skeletonCard}>
          <View style={styles.skeletonCheckbox} />
          <View style={styles.skeletonCopy}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
          </View>
          <View style={styles.skeletonMenu} />
        </View>
      ) : item.type === 'finishedHeader' ? (
        <View style={styles.finishedSectionRow}>
          <Text style={styles.finishedSectionTitle}>FINISHED</Text>
          <Text style={styles.count}>{finishedHabits.length}</Text>
        </View>
      ) : item.type === 'longTermHeader' ? (
        <View style={styles.finishedSectionRow}>
          <Text style={styles.finishedSectionTitle}>LONG-TERM</Text>
          <Text style={styles.count}>{longTermHabits.length}</Text>
        </View>
      ) : (
        renderHabit(item.habit)
      ),
    [finishedHabits.length, longTermHabits.length, renderHabit, styles],
  );
  const listHeader = useMemo(
    () => (
      <>
        <FlashList
          horizontal
          data={filters}
          extraData={activeFilter}
          renderItem={renderFilter}
          keyExtractor={keyByFilter}
          ItemSeparatorComponent={HorizontalListSeparator}
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
          contentContainerStyle={styles.filters}
        />
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{activeFilter}</Text>
          <Text style={styles.count}>
            {isFilterLoading
              ? 'Loading…'
              : `${finishedHabits.length}/${visible.length} finished`}
          </Text>
        </View>
      </>
    ),
    [
      activeFilter,
      finishedHabits.length,
      isFilterLoading,
      renderFilter,
      styles,
      visible.length,
    ],
  );
  return (
    <ScreenContainer padded={false}>
      <View style={styles.headerPad}>
        <View style={styles.todayTop}>
          <View>
            {showRelativeDateLabel ? (
              <Text style={styles.eyebrow}>{relativeDateLabel}</Text>
            ) : null}
            <Text style={styles.dateTitle}>{formatShortDate(selected)}</Text>
            <Text style={styles.progressText}>
              {selected.toLocaleDateString('en-US', { weekday: 'long' })}
              {' • '}
              {selectedProgress.percentage}% Finished
            </Text>
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
        data={displayedHabitListItems}
        extraData={selectedDate}
        renderItem={renderHabitListItem}
        keyExtractor={keyByHabitListItem}
        getItemType={getHabitListItemType}
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
          (async () => {
            if (await update(habit.id, { note: value.trim() })) {
              setNoteHabit(undefined);
            } else {
              Alert.alert(
                'Unable to save note',
                'Your note could not be saved. Please try again.',
              );
            }
          })().catch(() => undefined);
        }}
        onSetNote={setNote}
      />
      <CelebrationModal
        celebration={celebration}
        onClose={dismissCelebration}
        onViewAchievements={() => {
          dismissCelebration();
          navigation
            .getParent<BottomTabNavigationProp<MainTabParamList>>()
            ?.navigate('History', {
              initialTab: 'Achievements',
              tabRequestId: Date.now(),
            });
        }}
      />
      <ToastMessage
        key={route.params?.toastRequestId}
        visible={Boolean(route.params?.toastMessage)}
        message={route.params?.toastMessage ?? ''}
        onDismiss={() =>
          navigation.setParams({
            toastMessage: undefined,
            toastRequestId: undefined,
          })
        }
      />
    </ScreenContainer>
  );
}
