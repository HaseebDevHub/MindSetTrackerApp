import React from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useTranslation, type TranslationKey } from '../../localization';
import { useAppStore } from '../../store/useAppStore';
import type { TodayStackParamList } from '../../types/models';
import { getHabitTotalSuccesses } from '../../utils/habitAnalytics';
import { fromDateKey } from '../../utils/dates';
import {
  normalizeHabitType,
  normalizeScheduleMode,
  normalizeWeekdays,
} from '../../utils/habitSchedule';
import useStyles from './TodayScreenStyle';

type Props = NativeStackScreenProps<TodayStackParamList, 'HabitDetail'>;

export function HabitDetailScreen({ navigation, route }: Props) {
  const styles = useStyles();
  const { isRTL, locale, t } = useTranslation();
  const habit = useAppStore(s =>
    s.habits.find(item => item.id === route.params.habitId),
  );
  if (!habit) {
    return (
      <ScreenContainer>
        <AppHeader
          title={t('habit_detail_unavailable_title')}
          onBack={navigation.goBack}
          isRTL={isRTL}
        />
        <Text style={[styles.emptyText, isRTL && styles.centeredTextRTL]}>
          {t('habit_detail_unavailable')}
        </Text>
      </ScreenContainer>
    );
  }
  const type = normalizeHabitType(habit.habitType);
  const typeKey: Record<typeof type, TranslationKey> = {
    REGULAR: 'habit_type_regular',
    NEGATIVE: 'habit_type_negative',
    ONE_TIME: 'habit_type_one_time',
  };
  const timeKey: Record<typeof habit.timeOfDay, TranslationKey> = {
    ANYTIME: 'habit_time_anytime',
    MORNING: 'habit_time_morning',
    AFTERNOON: 'habit_time_afternoon',
    EVENING: 'habit_time_evening',
  };
  const mode = normalizeScheduleMode(habit.scheduleMode, habit.frequency);
  let schedule = t(
    (
      {
        EVERYDAY: 'habit_schedule_everyday',
        WEEKDAYS: 'habit_schedule_weekdays',
        SPECIFIC_DAYS: 'habit_schedule_specific',
        WEEKLY_QUOTA: 'habit_schedule_weekly',
        MONTHLY_QUOTA: 'habit_schedule_monthly',
        YEARLY_QUOTA: 'habit_schedule_yearly',
        ONE_TIME: 'habit_schedule_one_time',
      } as const
    )[mode],
  );
  if (mode === 'SPECIFIC_DAYS') {
    schedule = normalizeWeekdays(habit.selectedWeekdays)
      .map(day =>
        new Date(2026, 8, 6 + day).toLocaleDateString(locale, {
          weekday: 'short',
        }),
      )
      .join(', ');
  } else if (mode === 'WEEKLY_QUOTA')
    schedule = t('habit_schedule_weekly_count', {
      count: habit.quotaCount ?? 1,
    });
  else if (mode === 'MONTHLY_QUOTA')
    schedule = t('habit_schedule_monthly_count', {
      count: habit.quotaCount ?? 1,
    });
  else if (mode === 'YEARLY_QUOTA')
    schedule = t('habit_schedule_yearly_count', {
      count: habit.quotaCount ?? 1,
    });
  else if (mode === 'ONE_TIME' && habit.targetDate)
    schedule = t('habit_schedule_once_on', {
      date: fromDateKey(habit.targetDate).toLocaleDateString(locale, {
        dateStyle: 'medium',
      }),
    });
  return (
    <ScreenContainer>
      <AppHeader
        title={t('habit_detail_title')}
        onBack={navigation.goBack}
        isRTL={isRTL}
      />
      <View style={styles.detailHero}>
        <Text style={[styles.detailTitle, isRTL && styles.textRTL]}>
          {habit.title}
        </Text>
        <Text style={[styles.detailTime, isRTL && styles.textRTL]}>
          {t('habit_detail_summary', {
            type: t(typeKey[type]).replace('\n', ' '),
            schedule,
            time: t(timeKey[habit.timeOfDay]),
          })}
        </Text>
        <View style={[styles.detailMetric, isRTL && styles.detailMetricRTL]}>
          <Text style={[styles.metricNumber, isRTL && styles.textRTL]}>
            {getHabitTotalSuccesses(habit)}
          </Text>
          <Text style={[styles.metricLabel, isRTL && styles.textRTL]}>
            {t('habit_detail_successful_days')}
          </Text>
        </View>
      </View>
      {habit.note ? (
        <View style={styles.noteCard}>
          <Text style={[styles.label, isRTL && styles.textRTL]}>
            {t('habit_detail_latest_note')}
          </Text>
          <Text style={[styles.noteText, isRTL && styles.textRTL]}>
            {habit.note}
          </Text>
        </View>
      ) : null}
      <AppButton
        title={t('habit_detail_edit')}
        onPress={() =>
          navigation.navigate('CreateHabit', { habitId: habit.id })
        }
        style={styles.save}
      />
    </ScreenContainer>
  );
}
