import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import {
  Bell,
  BookOpen,
  Brain,
  Check,
  CloudSun,
  Droplets,
  Footprints,
  ListChecks,
  Moon,
  Pencil,
  Plus,
  Sun,
  Undo2,
  X,
} from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { AppInput } from '../../components/common/AppInput';
import {
  HorizontalListSeparator,
  SmallVerticalListSeparator,
  VerticalListSeparator,
} from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { HabitCard } from '../../components/habit/HabitCard';
import { colors, spacing } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import type {
  HabitItem,
  TimeOfDay,
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
import { keyById, keyByName, keyByValue } from '../../utils/lists';
import styles from './TodayScreenStyle';

type Props<T extends keyof TodayStackParamList> = NativeStackScreenProps<
  TodayStackParamList,
  T
>;
const filters: { key: TodayFilter; icon: typeof Sun }[] = [
  { key: 'ALL', icon: ListChecks },
  { key: 'MORNING', icon: Sun },
  { key: 'AFTERNOON', icon: CloudSun },
  { key: 'EVENING', icon: Moon },
];
const DATE_RANGE_DAYS = 365 * 10;

export function TodayScreen({ navigation }: Props<'TodayHome'>) {
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
  const visible = habits.filter(h =>
    isHabitVisibleForTodayFilter(h, filter),
  );
  const openNote = (habit: HabitItem) => {
    setMenuHabit(undefined);
    setNoteHabit(habit);
    setNote(habit.note ?? '');
  };
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
    [dateCellWidth, selectedDate, setDate],
  );
  const renderFilter = useCallback(
    ({ item: { key, icon: Icon } }: { item: (typeof filters)[number] }) => {
      const active = filter === key;
      return (
        <Pressable
          onPress={() => setFilter(key)}
          style={[styles.filter, active && styles.filterActive]}
        >
          <Icon color={active ? colors.text : colors.textSecondary} size={17} />
          <Text style={[styles.filterText, active && styles.activeText]}>
            {key}
          </Text>
        </Pressable>
      );
    },
    [filter, setFilter],
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
            <Plus color={colors.text} size={24} />
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
      <Modal
        transparent
        visible={Boolean(menuHabit)}
        animationType="fade"
        onRequestClose={() => setMenuHabit(undefined)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setMenuHabit(undefined)}
        >
          <View style={styles.popover}>
            {menuHabit?.completedDates.includes(selectedDate) ? (
              <MenuItem
                icon={Undo2}
                text="UNDO"
                onPress={() => {
                  toggle(menuHabit.id, selectedDate);
                  setMenuHabit(undefined);
                }}
              />
            ) : null}
            <MenuItem
              icon={Pencil}
              text="TAKE A NOTE"
              onPress={() => menuHabit && openNote(menuHabit)}
            />
            <MenuItem
              icon={BookOpen}
              text="EDIT"
              onPress={() => {
                if (menuHabit)
                  navigation.navigate('CreateHabit', { habitId: menuHabit.id });
                setMenuHabit(undefined);
              }}
            />
          </View>
        </Pressable>
      </Modal>
      <Modal
        transparent
        visible={Boolean(noteHabit)}
        animationType="slide"
        onRequestClose={() => setNoteHabit(undefined)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setNoteHabit(undefined)}
        >
          <Pressable
            style={styles.sheet}
            onPress={event => event.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTop}>
              <Text style={styles.sheetTitle}>Habit note</Text>
              <Pressable onPress={() => setNoteHabit(undefined)}>
                <X color={colors.textSecondary} />
              </Pressable>
            </View>
            <AppInput
              multiline
              value={note}
              onChangeText={setNote}
              placeholder="How did it go today?"
            />
            <AppButton
              title="SAVE NOTE"
              onPress={() => {
                if (noteHabit) update(noteHabit.id, { note: note.trim() });
                setNoteHabit(undefined);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

function MenuItem({
  icon: Icon,
  text,
  onPress,
}: {
  icon: typeof Undo2;
  text: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <Icon color={colors.textSecondary} size={18} />
      <Text style={styles.menuText}>{text}</Text>
    </Pressable>
  );
}

const iconOptions = [
  { name: 'Droplets', icon: Droplets },
  { name: 'Footprints', icon: Footprints },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Brain', icon: Brain },
  { name: 'Moon', icon: Moon },
];
const timeOptions: TimeOfDay[] = ['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME'];

export function CreateHabitScreen({ navigation, route }: Props<'CreateHabit'>) {
  const habits = useAppStore(s => s.habits);
  const add = useAppStore(s => s.addHabit);
  const update = useAppStore(s => s.updateHabit);
  const existing = habits.find(h => h.id === route.params?.habitId);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [iconName, setIcon] = useState(existing?.iconName ?? 'Droplets');
  const [time, setTime] = useState<TimeOfDay>(existing?.timeOfDay ?? 'MORNING');
  const [reminder, setReminder] = useState(existing?.reminderEnabled ?? false);
  const save = () => {
    if (!title.trim()) return;
    if (existing)
      update(existing.id, {
        title: title.trim(),
        iconName,
        timeOfDay: time,
        reminderEnabled: reminder,
      });
    else
      add({
        title: title.trim(),
        iconName,
        timeOfDay: time,
        reminderEnabled: reminder,
      });
    navigation.goBack();
  };
  return (
    <ScreenContainer scroll keyboard style={styles.form}>
      <AppHeader
        title={existing ? 'EDIT HABIT' : 'NEW HABIT'}
        onBack={navigation.goBack}
      />
      <Text style={styles.formIntro}>
        {existing
          ? 'Fine-tune this habit.'
          : 'Create a small action you can repeat.'}
      </Text>
      <AppInput
        label="Habit name"
        autoFocus={!existing}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Read for 10 minutes"
        maxLength={80}
      />
      <Text style={styles.label}>ICON</Text>
      <FlashList
        horizontal
        data={iconOptions}
        keyExtractor={keyByName}
        renderItem={({ item: { name, icon: Icon } }) => (
          <Pressable
            accessibilityLabel={`${name} icon`}
            onPress={() => setIcon(name)}
            style={[styles.iconOption, iconName === name && styles.iconActive]}
          >
            <Icon
              color={iconName === name ? colors.text : colors.textSecondary}
              size={23}
            />
          </Pressable>
        )}
        ItemSeparatorComponent={SmallVerticalListSeparator}
        showsHorizontalScrollIndicator={false}
        style={styles.iconOptions}
      />
      <Text style={styles.label}>TIME OF DAY</Text>
      <FlashList
        data={timeOptions}
        numColumns={2}
        keyExtractor={keyByValue}
        renderItem={({ item }) => (
          <View style={styles.timeOptionCell}>
            <Pressable
              onPress={() => setTime(item)}
              style={[styles.timeOption, time === item && styles.timeActive]}
            >
              <Text
                style={[styles.timeText, time === item && styles.activeText]}
              >
                {item}
              </Text>
            </Pressable>
          </View>
        )}
        ItemSeparatorComponent={HorizontalListSeparator}
        scrollEnabled={false}
        style={styles.timeGrid}
      />
      <View style={styles.reminder}>
        <View style={styles.reminderIcon}>
          <Bell color={colors.primary} size={21} />
        </View>
        <View style={styles.reminderCopy}>
          <Text style={styles.reminderTitle}>Habit reminder</Text>
          <Text style={styles.reminderHint}>
            Local preference only • 8:00 AM
          </Text>
        </View>
        <Switch
          value={reminder}
          onValueChange={setReminder}
          trackColor={{ false: colors.muted, true: colors.primary }}
          thumbColor={colors.text}
        />
      </View>
      <Text style={styles.mockHint}>
        Reminder scheduling and permissions are not enabled in this UI preview.
      </Text>
      <AppButton
        title={existing ? 'SAVE CHANGES' : 'CREATE HABIT'}
        disabled={!title.trim()}
        onPress={save}
        style={styles.save}
      />
    </ScreenContainer>
  );
}

export function HabitDetailScreen({ navigation, route }: Props<'HabitDetail'>) {
  const habit = useAppStore(s =>
    s.habits.find(item => item.id === route.params.habitId),
  );
  if (!habit)
    return (
      <ScreenContainer>
        <AppHeader title="HABIT" onBack={navigation.goBack} />
        <Text style={styles.emptyText}>This habit is no longer available.</Text>
      </ScreenContainer>
    );
  return (
    <ScreenContainer>
      <AppHeader title="HABIT DETAILS" onBack={navigation.goBack} />
      <View style={styles.detailHero}>
        <Text style={styles.detailTitle}>{habit.title}</Text>
        <Text style={styles.detailTime}>{habit.timeOfDay}</Text>
        <View style={styles.detailMetric}>
          <Text style={styles.metricNumber}>{habit.completedDates.length}</Text>
          <Text style={styles.metricLabel}>TOTAL COMPLETIONS</Text>
        </View>
      </View>
      {habit.note ? (
        <View style={styles.noteCard}>
          <Text style={styles.label}>LATEST NOTE</Text>
          <Text style={styles.noteText}>{habit.note}</Text>
        </View>
      ) : null}
      <AppButton
        title="EDIT HABIT"
        onPress={() =>
          navigation.navigate('CreateHabit', { habitId: habit.id })
        }
        style={styles.save}
      />
    </ScreenContainer>
  );
}
