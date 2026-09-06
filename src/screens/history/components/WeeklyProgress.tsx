import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { useAppStore } from '../../../store/useAppStore';
import { useTranslation, type TranslationKey } from '../../../localization';
import { fromDateKey } from '../../../utils/dates';
import {
  calculateSelectedWeekMetrics,
  getHabitQuotaProgress,
  isLongTermHabit,
} from '../../../utils/habitAnalytics';
import type { WeekStartsOn } from '../../../types/models';
import useStyles from '../HistoryScreenStyle';

const periodTranslationKeys: Record<'week' | 'month' | 'year', TranslationKey> =
  {
    week: 'history_period_week',
    month: 'history_period_month',
    year: 'history_period_year',
  };

function shortDate(dateKey: string, locale: string) {
  return fromDateKey(dateKey).toLocaleDateString(locale, {
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
  const { isRTL, locale, t } = useTranslation();
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
      (
        item,
      ): item is typeof item & {
        progress: NonNullable<typeof item.progress>;
      } => Boolean(item.progress),
    );
  const year = fromDateKey(progress.endKey).getFullYear();
  const displayedDays = isRTL ? [...progress.days].reverse() : progress.days;

  return (
    <View style={styles.weeklySection}>
      <Text style={[styles.weeklySectionTitle, isRTL && styles.textRTL]}>
        {t('history_weekly_progress')}
      </Text>
      <Text style={[styles.weeklySectionCaption, isRTL && styles.textRTL]}>
        {t('history_selected_week')}
      </Text>
      <View style={styles.weeklyCard}>
        <View style={[styles.weeklyHeader, isRTL && styles.rowRTL]}>
          <View>
            <Text style={[styles.weeklyRange, isRTL && styles.textRTL]}>
              {shortDate(progress.startKey, locale)} –{' '}
              {shortDate(progress.endKey, locale)}
            </Text>
            <Text style={[styles.weeklyYear, isRTL && styles.textRTL]}>
              {year}
            </Text>
          </View>
          <View
            style={[styles.weeklyRateGroup, isRTL && styles.weeklyRateGroupRTL]}
          >
            <Text style={styles.weeklyRate}>{`${progress.percentage}%`}</Text>
            <Text style={[styles.weeklyRateLabel, isRTL && styles.textRTL]}>
              {t('history_average_completion_rate')}
            </Text>
          </View>
        </View>

        <View style={styles.weeklyChart}>
          {displayedDays.map(day => (
            <View
              key={day.dateKey}
              accessible
              accessibilityLabel={t('history_weekly_day_accessibility', {
                date: fromDateKey(day.dateKey).toLocaleDateString(locale, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
                progress: day.isFuture
                  ? t('history_pending')
                  : t('history_day_progress_accessibility', {
                      percentage: day.percentage,
                      achieved: day.achieved,
                      target: day.target,
                    }),
              })}
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
                  .toLocaleDateString(locale, { weekday: 'short' })
                  .slice(0, 1)}
              </Text>
              <Text style={styles.weeklyDayDate}>
                {fromDateKey(day.dateKey).getDate()}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.weeklySummary}>
          <View style={[styles.weeklySummaryRow, isRTL && styles.rowRTL]}>
            <Text style={[styles.weeklySummaryLabel, isRTL && styles.textRTL]}>
              {t('history_progress_completed')}
            </Text>
            <Text style={styles.weeklySummaryValue}>{progress.achieved}</Text>
          </View>
          <View style={[styles.weeklySummaryRow, isRTL && styles.rowRTL]}>
            <Text style={[styles.weeklySummaryLabel, isRTL && styles.textRTL]}>
              {t('history_progress_scheduled')}
            </Text>
            <Text style={styles.weeklySummaryValue}>{progress.target}</Text>
          </View>
        </View>
        {longTermProgress.length ? (
          <View style={styles.longTermSummary}>
            <Text
              style={[styles.longTermSummaryTitle, isRTL && styles.textRTL]}
            >
              {t('history_long_term_progress')}
            </Text>
            {longTermProgress.map(({ habit, progress: quota }) => (
              <View
                key={habit.id}
                style={[styles.weeklySummaryRow, isRTL && styles.rowRTL]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.longTermSummaryLabel,
                    isRTL && styles.textRTL,
                    isRTL && styles.longTermSummaryLabelRTL,
                  ]}
                >
                  {habit.title}
                </Text>
                <Text style={styles.weeklySummaryValue}>
                  {t('history_quota_progress', {
                    completed: quota.completed,
                    target: quota.target,
                    period: t(periodTranslationKeys[quota.periodLabel]),
                  })}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
