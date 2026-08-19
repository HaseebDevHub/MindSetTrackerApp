import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Lock,
  Target,
  Trophy,
  X,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import {
  HorizontalListSeparator,
  SmallVerticalListSeparator,
} from '../../components/common/ListSeparator';
import { colors } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import type { HabitItem } from '../../types/models';
import { getCalendarDays, monthTitle, toDateKey } from '../../utils/dates';
import { keyByName, keyByTitle, keyByValue } from '../../utils/lists';
import styles from './HistoryScreenStyle';

type Tab = 'Calendar' | 'All Habits' | 'Achievements';
const tabs: Tab[] = ['Calendar', 'All Habits', 'Achievements'];
const weekLabels = [
  { id: 'sun', name: 'S' },
  { id: 'mon', name: 'M' },
  { id: 'tue', name: 'T' },
  { id: 'wed', name: 'W' },
  { id: 'thu', name: 'T' },
  { id: 'fri', name: 'F' },
  { id: 'sat', name: 'S' },
];

export function HistoryScreen() {
  const [tab, setTab] = useState<Tab>('Calendar');
  const renderTab = useCallback(
    ({ item }: { item: Tab }) => (
      <Pressable
        onPress={() => setTab(item)}
        style={[styles.tab, tab === item && styles.activeTab]}
      >
        <Text style={[styles.tabText, tab === item && styles.activeTabText]}>
          {item}
        </Text>
      </Pressable>
    ),
    [tab],
  );
  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>HISTORY</Text>
      </View>
      <FlashList
        data={tabs}
        numColumns={3}
        renderItem={renderTab}
        keyExtractor={keyByValue}
        extraData={tab}
        scrollEnabled={false}
        style={styles.tabs}
      />
      {tab === 'Calendar' ? (
        <CalendarHistory />
      ) : tab === 'All Habits' ? (
        <AllHabits />
      ) : (
        <Achievements />
      )}
    </ScreenContainer>
  );
}

function CalendarHistory() {
  const { width } = useWindowDimensions();
  const habits = useAppStore(s => s.habits);
  const selectedDate = useAppStore(s => s.selectedDate);
  const setSelectedDate = useAppStore(s => s.setSelectedDate);
  const [month, setMonth] = useState(new Date());
  const allCompletions = habits.flatMap(h => h.completedDates);
  const uniqueDays = new Set(allCompletions);
  const completed = allCompletions.length;
  const currentWeek = allCompletions.filter(
    key =>
      Math.abs(
        (Date.now() - new Date(`${key}T12:00:00`).getTime()) / 86400000,
      ) < 7,
  ).length;
  const totalPossible = Math.max(1, habits.length * 7);
  const rate = Math.min(100, Math.round((currentWeek / totalPossible) * 100));
  const metrics = [
    {
      title: 'CURRENT STREAK',
      value: String(
        habits.reduce(
          (highest, habit) => Math.max(highest, habit.streakCount),
          0,
        ),
      ),
      caption: 'Best Streak: 2',
      color: colors.selectedBlue,
    },
    {
      title: 'HABITS FINISHED',
      value: String(completed),
      caption: `This week: ${currentWeek}`,
      color: colors.red,
    },
    {
      title: 'COMPLETION RATE',
      value: `${rate}%`,
      caption: `${currentWeek}/${totalPossible} habits`,
      color: colors.yellow,
    },
    {
      title: 'PERFECT DAYS',
      value: '0',
      caption: 'This week: 0',
      color: colors.green,
    },
  ];
  const days = getCalendarDays(month);
  const calendarCellSize = (width - 72) / 7;
  const renderMetric = ({
    item: metric,
  }: {
    item: (typeof metrics)[number];
  }) => (
    <View style={[styles.metric, { backgroundColor: metric.color }]}>
      <Text style={styles.metricTitle}>{metric.title}</Text>
      <Text style={styles.metricValue}>{metric.value}</Text>
      <Text style={styles.metricCaption}>{metric.caption}</Text>
    </View>
  );
  const renderDay = ({ item: date }: { item: Date | null }) => {
    if (!date)
      return <View style={[styles.day, { width: calendarCellSize }]} />;
    const key = toDateKey(date);
    const selected = selectedDate === key;
    const didComplete = uniqueDays.has(key);
    return (
      <Pressable
        accessibilityLabel={date.toDateString()}
        onPress={() => setSelectedDate(key)}
        style={[
          styles.day,
          { width: calendarCellSize },
          selected && styles.selectedDay,
        ]}
      >
        <Text style={[styles.dayText, selected && styles.selectedDayText]}>
          {date.getDate()}
        </Text>
        {didComplete ? (
          <View style={[styles.dot, selected && styles.dotSelected]} />
        ) : null}
      </Pressable>
    );
  };
  return (
    <FlashList
      data={[monthTitle(month)]}
      keyExtractor={keyByValue}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      ListHeaderComponent={
        <FlashList
          horizontal
          data={metrics}
          renderItem={renderMetric}
          keyExtractor={keyByTitle}
          ItemSeparatorComponent={HorizontalListSeparator}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricRow}
          style={styles.metricList}
        />
      }
      renderItem={() => (
        <View style={styles.calendar}>
          <View style={styles.calendarTop}>
            <Pressable
              accessibilityLabel="Previous month"
              onPress={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
            >
              <ChevronLeft color={colors.text} />
            </Pressable>
            <Text style={styles.month}>{monthTitle(month)}</Text>
            <Pressable
              accessibilityLabel="Next month"
              onPress={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
            >
              <ChevronRight color={colors.text} />
            </Pressable>
          </View>
          <FlashList
            horizontal
            data={weekLabels}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Text style={[styles.weekLabel, { width: calendarCellSize }]}>
                {item.name}
              </Text>
            )}
            scrollEnabled={false}
            style={styles.week}
          />
          <FlashList
            data={days}
            numColumns={7}
            keyExtractor={(date, index) =>
              date ? toDateKey(date) : `blank-${index}`
            }
            renderItem={renderDay}
            scrollEnabled={false}
            style={{ height: Math.ceil(days.length / 7) * calendarCellSize }}
          />
        </View>
      )}
      ListFooterComponent={
        <Text style={styles.legend}>
          A dot marks days with at least one completed habit.
        </Text>
      }
    />
  );
}

type HabitHistoryRow =
  | { id: string; type: 'section'; title: string }
  | { id: string; type: 'habit'; habit: HabitItem };

function AllHabits() {
  const habits = useAppStore(s => s.habits);
  const [selected, setSelected] = useState<HabitItem>();
  const rows = useMemo<HabitHistoryRow[]>(() => {
    const result: HabitHistoryRow[] = [];
    for (const time of ['ANYTIME', 'MORNING', 'AFTERNOON', 'EVENING']) {
      const matches = habits.filter(
        habit => habit.timeOfDay === time && !habit.archived,
      );
      if (!matches.length) continue;
      result.push({ id: `section-${time}`, type: 'section', title: time });
      for (const habit of matches) {
        result.push({ id: habit.id, type: 'habit', habit });
      }
    }
    return result;
  }, [habits]);
  return (
    <>
      <FlashList
        data={rows}
        keyExtractor={item => item.id}
        getItemType={item => item.type}
        contentContainerStyle={styles.allHabits}
        ListHeaderComponent={
          <Text style={styles.activeLabel}>
            ACTIVE ({habits.filter(h => !h.archived).length})
          </Text>
        }
        ItemSeparatorComponent={SmallVerticalListSeparator}
        renderItem={({ item }) =>
          item.type === 'section' ? (
            <Text style={styles.groupTitle}>{item.title}</Text>
          ) : (
            <Pressable
              onPress={() => setSelected(item.habit)}
              style={styles.historyHabit}
            >
              <View style={styles.historyCheck}>
                <Check color={colors.primary} size={16} />
              </View>
              <View style={styles.historyCopy}>
                <Text style={styles.historyTitle}>{item.habit.title}</Text>
                <Text style={styles.historyMeta}>
                  {item.habit.completedDates.length} completions •{' '}
                  {item.habit.streakCount} day streak
                </Text>
              </View>
              <ChevronRight color={colors.muted} size={20} />
            </Pressable>
          )
        }
      />
      <Modal
        transparent
        visible={Boolean(selected)}
        animationType="fade"
        onRequestClose={() => setSelected(undefined)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelected(undefined)}
        >
          <Pressable
            style={styles.habitModal}
            onPress={event => event.stopPropagation()}
          >
            <Pressable
              style={styles.modalClose}
              onPress={() => setSelected(undefined)}
            >
              <X color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.detailLabel}>HABIT HISTORY</Text>
            <Text style={styles.modalTitle}>{selected?.title}</Text>
            <Text style={styles.modalMetric}>
              {selected?.completedDates.length ?? 0}
            </Text>
            <Text style={styles.modalCaption}>TOTAL COMPLETIONS</Text>
            <Text style={styles.modalBody}>
              This habit is scheduled for {selected?.timeOfDay.toLowerCase()}.
              Edit it from the Today tab.
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const badgeData = [
  { name: 'Finish Habit for The First Time', goal: 1, icon: Check },
  { name: '10 Times', goal: 10, icon: Trophy },
  { name: '20 Times', goal: 20, icon: Award },
  { name: '3 Perfect Days', goal: 3, icon: Target },
  { name: '3 Days Streak', goal: 3, icon: Flame },
  { name: '7 Days Streak', goal: 7, icon: Flame },
];
function Achievements() {
  const habits = useAppStore(s => s.habits);
  const completions = habits.reduce(
    (sum, habit) => sum + habit.completedDates.length,
    0,
  );
  const bestStreak = habits.reduce(
    (highest, habit) => Math.max(highest, habit.streakCount),
    0,
  );
  return (
    <FlashList
      data={badgeData}
      numColumns={2}
      keyExtractor={keyByName}
      contentContainerStyle={styles.achievements}
      ListHeaderComponent={
        <View style={styles.achievementHeader}>
          <Text style={styles.achievementTitle}>My achievements</Text>
          <Text style={styles.noAchievements}>
            {completions === 0
              ? "You haven't got any achievements yet."
              : 'Keep going — every check builds momentum.'}
          </Text>
        </View>
      }
      ItemSeparatorComponent={SmallVerticalListSeparator}
      renderItem={({ item: { name, goal, icon: Icon }, index }) => {
        const unlocked = index < 3 ? completions >= goal : bestStreak >= goal;
        return (
          <View style={styles.badgeCell}>
            <View style={styles.badgeCard}>
              <View
                style={[styles.badgeCircle, unlocked && styles.badgeUnlocked]}
              >
                {unlocked ? (
                  <Icon color={colors.text} size={28} />
                ) : (
                  <Lock color={colors.muted} size={25} />
                )}
              </View>
              <Text style={[styles.badgeName, !unlocked && styles.lockedText]}>
                {name}
              </Text>
              <Text style={styles.badgeState}>
                {unlocked ? 'UNLOCKED' : 'LOCKED'}
              </Text>
            </View>
          </View>
        );
      }}
    />
  );
}
