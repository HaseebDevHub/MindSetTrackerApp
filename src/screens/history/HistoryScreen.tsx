import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
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
import { colors } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import type { HabitItem } from '../../types/models';
import { getCalendarDays, monthTitle, toDateKey } from '../../utils/dates';
import styles from './HistoryScreenStyle';

type Tab = 'Calendar' | 'All Habits' | 'Achievements';
const tabs: Tab[] = ['Calendar', 'All Habits', 'Achievements'];

export function HistoryScreen() {
  const [tab, setTab] = useState<Tab>('Calendar');
  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>HISTORY</Text>
      </View>
      <View style={styles.tabs}>
        {tabs.map(item => (
          <Pressable
            key={item}
            onPress={() => setTab(item)}
            style={[styles.tab, tab === item && styles.activeTab]}
          >
            <Text
              style={[styles.tabText, tab === item && styles.activeTabText]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
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
      value: String(Math.max(...habits.map(h => h.streakCount), 0)),
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
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.metricRow}
      >
        {metrics.map(metric => (
          <View
            key={metric.title}
            style={[styles.metric, { backgroundColor: metric.color }]}
          >
            <Text style={styles.metricTitle}>{metric.title}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricCaption}>{metric.caption}</Text>
          </View>
        ))}
      </ScrollView>
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
        <View style={styles.week}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((name, i) => (
            <Text key={`${name}-${i}`} style={styles.weekLabel}>
              {name}
            </Text>
          ))}
        </View>
        <View style={styles.days}>
          {days.map((date, index) => {
            if (!date)
              return <View key={`blank-${index}`} style={styles.day} />;
            const key = toDateKey(date);
            const selected = selectedDate === key;
            const didComplete = uniqueDays.has(key);
            return (
              <Pressable
                accessibilityLabel={date.toDateString()}
                key={key}
                onPress={() => setSelectedDate(key)}
                style={[styles.day, selected && styles.selectedDay]}
              >
                <Text
                  style={[styles.dayText, selected && styles.selectedDayText]}
                >
                  {date.getDate()}
                </Text>
                {didComplete ? (
                  <View style={[styles.dot, selected && styles.dotSelected]} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
      <Text style={styles.legend}>
        A dot marks days with at least one completed habit.
      </Text>
    </ScrollView>
  );
}

function AllHabits() {
  const habits = useAppStore(s => s.habits);
  const [selected, setSelected] = useState<HabitItem>();
  const grouped = useMemo(
    () =>
      ['ANYTIME', 'MORNING', 'AFTERNOON', 'EVENING']
        .map(time => ({
          time,
          habits: habits.filter(h => h.timeOfDay === time && !h.archived),
        }))
        .filter(group => group.habits.length),
    [habits],
  );
  return (
    <>
      <ScrollView contentContainerStyle={styles.allHabits}>
        <Text style={styles.activeLabel}>
          ACTIVE ({habits.filter(h => !h.archived).length})
        </Text>
        {grouped.map(group => (
          <View key={group.time} style={styles.habitGroup}>
            <Text style={styles.groupTitle}>{group.time}</Text>
            {group.habits.map(habit => (
              <Pressable
                key={habit.id}
                onPress={() => setSelected(habit)}
                style={styles.historyHabit}
              >
                <View style={styles.historyCheck}>
                  <Check color={colors.primary} size={16} />
                </View>
                <View style={styles.historyCopy}>
                  <Text style={styles.historyTitle}>{habit.title}</Text>
                  <Text style={styles.historyMeta}>
                    {habit.completedDates.length} completions •{' '}
                    {habit.streakCount} day streak
                  </Text>
                </View>
                <ChevronRight color={colors.muted} size={20} />
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
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
  const bestStreak = Math.max(...habits.map(h => h.streakCount), 0);
  return (
    <ScrollView contentContainerStyle={styles.achievements}>
      <Text style={styles.achievementTitle}>My achievements</Text>
      {completions === 0 ? (
        <Text style={styles.noAchievements}>
          You haven't got any achievements yet.
        </Text>
      ) : (
        <Text style={styles.noAchievements}>
          Keep going — every check builds momentum.
        </Text>
      )}
      <View style={styles.badgeGrid}>
        {badgeData.map(({ name, goal, icon: Icon }, index) => {
          const unlocked = index < 3 ? completions >= goal : bestStreak >= goal;
          return (
            <View key={name} style={styles.badgeCard}>
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
          );
        })}
      </View>
    </ScrollView>
  );
}
