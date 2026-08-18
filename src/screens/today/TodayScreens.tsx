import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Bell,
  BookOpen,
  Brain,
  Check,
  CloudSun,
  Droplets,
  Footprints,
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
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { HabitCard } from '../../components/habit/HabitCard';
import { colors } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import type {
  HabitItem,
  TimeOfDay,
  TodayStackParamList,
} from '../../types/models';
import {
  addDays,
  formatShortDate,
  fromDateKey,
  toDateKey,
} from '../../utils/dates';
import styles from './TodayScreenStyle';

type Props<T extends keyof TodayStackParamList> = NativeStackScreenProps<
  TodayStackParamList,
  T
>;
const filters: { key: TimeOfDay; icon: typeof Sun }[] = [
  { key: 'MORNING', icon: Sun },
  { key: 'AFTERNOON', icon: CloudSun },
  { key: 'EVENING', icon: Moon },
];

export function TodayScreen({ navigation }: Props<'TodayHome'>) {
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
  const dates = useMemo(() => {
    const center = fromDateKey(selectedDate);
    return Array.from({ length: 7 }, (_, i) => addDays(center, i - 3));
  }, [selectedDate]);
  const visible = habits.filter(
    h => !h.archived && (h.timeOfDay === filter || h.timeOfDay === 'ANYTIME'),
  );
  const openNote = (habit: HabitItem) => {
    setMenuHabit(undefined);
    setNoteHabit(habit);
    setNote(habit.note ?? '');
  };
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
      <View style={styles.dateStrip}>
        {dates.map(date => {
          const key = toDateKey(date);
          const active = key === selectedDate;
          return (
            <Pressable
              key={key}
              accessibilityLabel={date.toDateString()}
              onPress={() => setDate(key)}
              style={[styles.dateCell, active && styles.dateActive]}
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
        })}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map(({ key, icon: Icon }) => {
            const active = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={[styles.filter, active && styles.filterActive]}
              >
                <Icon
                  color={active ? colors.text : colors.textSecondary}
                  size={17}
                />
                <Text style={[styles.filterText, active && styles.activeText]}>
                  {key}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{filter}</Text>
          <Text style={styles.count}>
            {
              visible.filter(h => h.completedDates.includes(selectedDate))
                .length
            }
            /{visible.length} finished
          </Text>
        </View>
        <View style={styles.habitList}>
          {visible.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              completed={habit.completedDates.includes(selectedDate)}
              onToggle={() => toggle(habit.id, selectedDate)}
              onMenu={() => setMenuHabit(habit)}
              onPress={() =>
                navigation.navigate('HabitDetail', { habitId: habit.id })
              }
            />
          ))}
        </View>
        {!visible.length ? (
          <View style={styles.empty}>
            <Check color={colors.muted} size={38} />
            <Text style={styles.emptyTitle}>A clear schedule</Text>
            <Text style={styles.emptyText}>
              No habits match this time of day yet.
            </Text>
          </View>
        ) : null}
        <AppButton
          title="CREATE A NEW HABIT"
          variant="secondary"
          onPress={() => navigation.navigate('CreateHabit')}
          style={styles.create}
        />
      </ScrollView>
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
      <View style={styles.iconOptions}>
        {iconOptions.map(({ name, icon: Icon }) => (
          <Pressable
            key={name}
            accessibilityLabel={`${name} icon`}
            onPress={() => setIcon(name)}
            style={[styles.iconOption, iconName === name && styles.iconActive]}
          >
            <Icon
              color={iconName === name ? colors.text : colors.textSecondary}
              size={23}
            />
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>TIME OF DAY</Text>
      <View style={styles.timeGrid}>
        {timeOptions.map(item => (
          <Pressable
            key={item}
            onPress={() => setTime(item)}
            style={[styles.timeOption, time === item && styles.timeActive]}
          >
            <Text style={[styles.timeText, time === item && styles.activeText]}>
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
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
