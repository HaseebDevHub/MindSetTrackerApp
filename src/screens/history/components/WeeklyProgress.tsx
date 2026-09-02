import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { useAppStore } from '../../../store/useAppStore';
import { fromDateKey } from '../../../utils/dates';
import {
  calculateSelectedWeekMetrics,
  getHabitQuotaProgress,
  isLongTermHabit,
} from '../../../utils/habitAnalytics';
import type { WeekStartsOn } from '../../../types/models';
import useStyles from '../HistoryScreenStyle';

function shortDate(dateKey: string) {
  return fromDateKey(dateKey).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function barHeight(percentage: number): ViewStyle {
  return {
    height:
      percentage > 0 ? (`${Math.max(percentage, 8)}%` as `${number}%`) : 0,
  };
}

export function WeeklyProgress({
  selectedDate,
  weekStartsOn,
}: {
  selectedDate: string;
  weekStartsOn: WeekStartsOn;
}) {
  const styles = useStyles();
  const habits = useAppStore(state => state.habits);
  const progress = calculateSelectedWeekMetrics(
    habits,
    selectedDate,
    weekStartsOn,
  );
  const longTermProgress = habits
    .filter(habit => !habit.archived && isLongTermHabit(habit))
    .map(habit => ({
      habit,
      progress: getHabitQuotaProgress(habit, selectedDate, weekStartsOn),
    }))
    .filter(
      (item): item is typeof item & { progress: NonNullable<typeof item.progress> } =>
        Boolean(item.progress),
    );
  const year = fromDateKey(progress.endKey).getFullYear();

  return (
    <View style={styles.weeklySection}>
      <Text style={styles.weeklySectionTitle}>WEEKLY PROGRESS</Text>
      <Text style={styles.weeklySectionCaption}>Selected week</Text>
      <View style={styles.weeklyCard}>
        <View style={styles.weeklyHeader}>
          <View>
            <Text style={styles.weeklyRange}>
              {shortDate(progress.startKey)} – {shortDate(progress.endKey)}
            </Text>
            <Text style={styles.weeklyYear}>{year}</Text>
          </View>
          <View style={styles.weeklyRateGroup}>
            <Text style={styles.weeklyRate}>{`${progress.percentage}%`}</Text>
            <Text style={styles.weeklyRateLabel}>Avg. completion rate</Text>
          </View>
        </View>

        <View style={styles.weeklyChart}>
          {progress.days.map(day => (
            <View
              key={day.dateKey}
              accessible
              accessibilityLabel={`${fromDateKey(day.dateKey).toDateString()}: ${
                day.isFuture
                  ? 'pending'
                  : `${day.percentage}% complete, ${day.achieved} of ${day.target} progress`
              }`}
              style={styles.weeklyDay}
            >
              <Text style={styles.weeklyDayPercentage}>
                {day.isFuture ? '—' : `${day.percentage}%`}
              </Text>
              <View style={styles.weeklyBarTrack}>
                <View
                  style={[styles.weeklyBarFill, barHeight(day.percentage)]}
                />
              </View>
              <Text style={styles.weeklyDayLabel}>
                {fromDateKey(day.dateKey)
                  .toLocaleDateString('en-US', { weekday: 'short' })
                  .slice(0, 1)}
              </Text>
              <Text style={styles.weeklyDayDate}>
                {fromDateKey(day.dateKey).getDate()}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.weeklySummary}>
          <View style={styles.weeklySummaryRow}>
            <Text style={styles.weeklySummaryLabel}>Progress completed</Text>
            <Text style={styles.weeklySummaryValue}>{progress.achieved}</Text>
          </View>
          <View style={styles.weeklySummaryRow}>
            <Text style={styles.weeklySummaryLabel}>Progress scheduled</Text>
            <Text style={styles.weeklySummaryValue}>{progress.target}</Text>
          </View>
        </View>
        {longTermProgress.length ? (
          <View style={styles.longTermSummary}>
            <Text style={styles.longTermSummaryTitle}>LONG-TERM PROGRESS</Text>
            {longTermProgress.map(({ habit, progress: quota }) => (
              <View key={habit.id} style={styles.weeklySummaryRow}>
                <Text numberOfLines={1} style={styles.longTermSummaryLabel}>
                  {habit.title}
                </Text>
                <Text style={styles.weeklySummaryValue}>
                  {quota.completed}/{quota.target} {quota.periodLabel}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
