import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import {
  Check,
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
import { isHabitVisibleForTodayFilter } from '../../utils/habits';
import { keyById } from '../../utils/lists';
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
  const [menuHabit, setMenuHabit] = useState<HabitItem>();
  const [noteHabit, setNoteHabit] = useState<HabitItem>();
  const [note, setNote] = useState('');
  const selected = fromDateKey(selectedDate);
  const dateRangeCenter = useRef(selectedDate).current;
  const dateCellWidth = (width - spacing.small * 2) / 7;
  const dates = useMemo(() => {
    const center = fromDateKey(dateRangeCenter);
    return Array.from({ length: DATE_RANGE_DAYS * 2 + 1 }, (_, index) =>
      addDays(center, index - DATE_RANGE_DAYS),
    );
  }, [dateRangeCenter]);
  const visible = habits.filter(h => isHabitVisibleForTodayFilter(h, filter));

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
            color={active ? colors.onPrimary : colors.textSecondary}
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
    ({ item: habit }: { item: HabitItem }) => (
      <HabitCard
        habit={habit}
        completed={habit.completedDates.includes(selectedDate)}
        onToggle={() => toggle(habit.id, selectedDate)}
        onMenu={() => setMenuHabit(habit)}
        onPress={() =>
          navigation.navigate('HabitDetail', { habitId: habit.id })
        }
      />
    ),
    [navigation, selectedDate, toggle],
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
          {visible.filter(h => h.completedDates.includes(selectedDate)).length}/
          {visible.length} finished
        </Text>
      </View>
    </>
  );
  return (
    <ScreenContainer padded={false}>
      <View style={styles.headerPad}>
        <View style={styles.todayTop}>
          <View>
            <Text style={styles.eyebrow}>TODAY</Text>
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
        horizontal
        data={dates}
        renderItem={renderDate}
        keyExtractor={date => toDateKey(date)}
        extraData={selectedDate}
        initialScrollIndex={DATE_RANGE_DAYS - 3}
        getItemLayout={(_, index) => ({
          length: dateCellWidth,
          offset: dateCellWidth * index,
          index,
        })}
        showsHorizontalScrollIndicator={false}
        style={styles.dateStrip}
        contentContainerStyle={styles.dateStripContent}
      />
      <FlashList
        data={visible}
        renderItem={renderHabit}
        keyExtractor={keyById}
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
      <HabitActionModals
        menuHabit={menuHabit}
        noteHabit={noteHabit}
        note={note}
        selectedDate={selectedDate}
        onCloseMenu={() => setMenuHabit(undefined)}
        onCloseNote={() => setNoteHabit(undefined)}
        onEdit={habit => {
          navigation.navigate('CreateHabit', { habitId: habit.id });
          setMenuHabit(undefined);
        }}
        onOpenNote={habit => {
          setMenuHabit(undefined);
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
          setMenuHabit(undefined);
        }}
      />
    </ScreenContainer>
  );
}
