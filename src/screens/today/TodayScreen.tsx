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
  ChevronRight,
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
import { useTranslation, type TranslationKey } from '../../localization';
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
const filterTranslationKeys: Record<TodayFilter, TranslationKey> = {
  ALL: 'filter_all',
  ANYTIME: 'filter_anytime',
  MORNING: 'filter_morning',
  AFTERNOON: 'filter_afternoon',
  EVENING: 'filter_evening',
};
const relativeDateTranslationKeys = {
  YESTERDAY: 'yesterday',
  TODAY: 'today',
  TOMORROW: 'tomorrow',
} as const satisfies Record<string, TranslationKey>;
type RelativeDateLabel = keyof typeof relativeDateTranslationKeys;
const isRelativeDateLabel = (value: string): value is RelativeDateLabel =>
  Object.prototype.hasOwnProperty.call(relativeDateTranslationKeys, value);
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
  const { isRTL, locale, t } = useTranslation();
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
  const showRelativeDateLabel = isRelativeDateLabel(relativeDateLabel);
  const displayedRelativeDateLabel = showRelativeDateLabel
    ? t(relativeDateTranslationKeys[relativeDateLabel])
    : relativeDateLabel;
  const habitActionLabels = useMemo(
    () => ({
      takeNote: t('take_note'),
      edit: t('edit'),
      habitNote: t('habit_note'),
      notePlaceholder: t('note_placeholder'),
      saveNote: t('save_note'),
      closeNote: t('close_note'),
    }),
    [t],
  );
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
          accessibilityLabel={date.toLocaleDateString(locale, {
            dateStyle: 'full',
          })}
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
              .toLocaleDateString(locale, { weekday: 'short' })
              .toUpperCase()}
          </Text>
          <View
            style={[
              styles.dateNumberCircle,
              active && styles.dateNumberCircleActive,
            ]}
          >
            <Text style={[styles.dayNumber, active && styles.activeDayNumber]}>
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
    [dateCellWidth, habits, locale, selectedDate, setDate, styles],
  );
  const renderFilter = useCallback(
    ({ item: { key, icon: Icon } }: { item: (typeof filters)[number] }) => {
      const active = activeFilter === key;
      return (
        <Pressable
          onPress={() => selectFilter(key)}
          style={[
            styles.filter,
            isRTL && styles.rowRTL,
            active && styles.filterActive,
          ]}
        >
          <Icon
            color={active ? colors.yellow : colors.textSecondary}
            size={17}
          />
          <Text
            style={[
              styles.filterText,
              isRTL && styles.textRTL,
              active && styles.accentActiveText,
            ]}
          >
            {t(filterTranslationKeys[key])}
          </Text>
        </Pressable>
      );
    },
    [activeFilter, colors, isRTL, selectFilter, styles, t],
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
            t('record_relapse_title'),
            t('record_relapse_message', { habitTitle: habit.title }),
            [
              { text: t('cancel'), style: 'cancel' },
              {
                text: t('record_relapse'),
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
    [openHabit, openHabitMenu, selectedDate, t, toggle, weekStartsOn],
  );
  const renderHabitListItem = useCallback(
    ({ item }: { item: HabitListItem }) =>
      item.type === 'skeleton' ? (
        <View style={[styles.skeletonCard, isRTL && styles.rowRTL]}>
          <View style={styles.skeletonCheckbox} />
          <View style={styles.skeletonCopy}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
          </View>
          <View style={styles.skeletonMenu} />
        </View>
      ) : item.type === 'finishedHeader' ? (
        <View style={[styles.finishedSectionRow, isRTL && styles.rowRTL]}>
          <Text style={[styles.finishedSectionTitle, isRTL && styles.textRTL]}>
            {t('finished_section')}
          </Text>
          <Text style={styles.count}>{finishedHabits.length}</Text>
        </View>
      ) : item.type === 'longTermHeader' ? (
        <View style={[styles.finishedSectionRow, isRTL && styles.rowRTL]}>
          <Text style={[styles.finishedSectionTitle, isRTL && styles.textRTL]}>
            {t('long_term_section')}
          </Text>
          <Text style={styles.count}>{longTermHabits.length}</Text>
        </View>
      ) : (
        renderHabit(item.habit)
      ),
    [
      finishedHabits.length,
      isRTL,
      longTermHabits.length,
      renderHabit,
      styles,
      t,
    ],
  );
  const listHeader = useMemo(
    () => (
      <>
        <FlashList
          horizontal
          inverted={isRTL}
          data={filters}
          extraData={activeFilter}
          renderItem={renderFilter}
          keyExtractor={keyByFilter}
          ItemSeparatorComponent={HorizontalListSeparator}
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
          contentContainerStyle={styles.filters}
        />
        <View style={[styles.sectionRow, isRTL && styles.rowRTL]}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {t(filterTranslationKeys[activeFilter])}
          </Text>
          <Text style={styles.count}>
            {isFilterLoading
              ? t('loading')
              : t('habits_finished_count', {
                  finished: finishedHabits.length,
                  total: visible.length,
                })}
          </Text>
        </View>
      </>
    ),
    [
      activeFilter,
      finishedHabits.length,
      isFilterLoading,
      isRTL,
      renderFilter,
      styles,
      t,
      visible.length,
    ],
  );
  return (
    <ScreenContainer padded={false}>
      <View style={styles.headerPad}>
        <View style={[styles.todayTop, isRTL && styles.rowRTL]}>
          <View>
            {showRelativeDateLabel ? (
              <Text style={[styles.eyebrow, isRTL && styles.textRTL]}>
                {displayedRelativeDateLabel}
              </Text>
            ) : null}
            <Text style={[styles.dateTitle, isRTL && styles.textRTL]}>
              {formatShortDate(selected, locale)}
            </Text>
            <Text style={[styles.progressText, isRTL && styles.textRTL]}>
              {selected.toLocaleDateString(locale, { weekday: 'long' })}
              {' • '}
              {t('percent_finished', {
                percentage: selectedProgress.percentage,
              })}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={t('create_new_habit_accessibility')}
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
        inverted={isRTL}
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
            <Text style={[styles.emptyTitle, isRTL && styles.textRTL]}>
              {t('A_clear_schedule')}
            </Text>
            <Text style={[styles.emptyText, isRTL && styles.centeredTextRTL]}>
              {t('No_habits_match_time_of_day')}
            </Text>
          </View>
        }
        ListFooterComponent={
          <AppButton
            title={t('create_new_habit')}
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
          isRTL && styles.todayButtonContainerRTL,
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
          accessibilityLabel={t('return_to_today')}
          accessibilityRole="button"
          onPress={returnToToday}
          style={({ pressed }) => [
            styles.todayButton,
            isRTL && styles.rowRTL,
            pressed && styles.todayButtonPressed,
          ]}
        >
          {isRTL ? (
            <ChevronRight
              color={colors.onPrimary}
              size={18}
              strokeWidth={2.5}
            />
          ) : (
            <ChevronLeft color={colors.onPrimary} size={18} strokeWidth={2.5} />
          )}
          <Text style={[styles.todayButtonText, isRTL && styles.textRTL]}>
            {t('today_button')}
          </Text>
        </Pressable>
      </Animated.View>
      <HabitActionModals
        isRTL={isRTL}
        labels={habitActionLabels}
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
                t('unable_save_note_title'),
                t('unable_save_note_message'),
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
        isRTL={isRTL}
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
