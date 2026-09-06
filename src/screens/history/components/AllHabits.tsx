import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react-native';
import { SmallVerticalListSeparator } from '../../../components/common/ListSeparator';
import { getHabitIcon } from '../../../constants/habitIcons';
import { normalizeHabitColor } from '../../../constants/habitColors';
import { useTheme } from '../../../context/ThemeContext';
import {
  useTranslation,
  type TranslationKey,
  type TranslationParameters,
} from '../../../localization';
import { useAppStore } from '../../../store/useAppStore';
import type { HabitItem } from '../../../types/models';
import { formatShortDate, fromDateKey } from '../../../utils/dates';
import { getHabitTotalSuccesses } from '../../../utils/habitAnalytics';
import {
  normalizeHabitType,
  normalizeScheduleMode,
  normalizeWeekdays,
} from '../../../utils/habitSchedule';
import useStyles from '../HistoryScreenStyle';

type HabitHistoryRow =
  | { id: string; type: 'section'; title: string }
  | { id: string; type: 'habit'; habit: HabitItem };

type Translate = (
  key: TranslationKey,
  parameters?: TranslationParameters,
) => string;

const timeTranslationKeys: Record<HabitItem['timeOfDay'], TranslationKey> = {
  ANYTIME: 'habit_time_anytime',
  MORNING: 'habit_time_morning',
  AFTERNOON: 'habit_time_afternoon',
  EVENING: 'habit_time_evening',
};
const habitTimes: HabitItem['timeOfDay'][] = [
  'ANYTIME',
  'MORNING',
  'AFTERNOON',
  'EVENING',
];

const habitTypeTranslationKeys = {
  REGULAR: 'history_habit_type_regular',
  NEGATIVE: 'history_habit_type_negative',
  ONE_TIME: 'history_habit_type_one_time',
} as const satisfies Record<
  ReturnType<typeof normalizeHabitType>,
  TranslationKey
>;

function localizedScheduleSummary(
  habit: HabitItem,
  t: Translate,
  locale: string,
) {
  const mode = normalizeScheduleMode(habit.scheduleMode, habit.frequency);
  if (mode === 'WEEKDAYS') return t('habit_schedule_weekdays');
  if (mode === 'SPECIFIC_DAYS') {
    const sunday = new Date(2021, 7, 1);
    return normalizeWeekdays(habit.selectedWeekdays)
      .map(day =>
        new Date(
          sunday.getFullYear(),
          sunday.getMonth(),
          sunday.getDate() + day,
        ).toLocaleDateString(locale, { weekday: 'short' }),
      )
      .join(', ');
  }
  if (mode === 'WEEKLY_QUOTA')
    return t('habit_schedule_weekly_count', { count: habit.quotaCount ?? 1 });
  if (mode === 'MONTHLY_QUOTA')
    return t('habit_schedule_monthly_count', { count: habit.quotaCount ?? 1 });
  if (mode === 'YEARLY_QUOTA')
    return t('habit_schedule_yearly_count', { count: habit.quotaCount ?? 1 });
  if (mode === 'ONE_TIME')
    return habit.targetDate
      ? t('habit_schedule_once_on', {
          date: formatShortDate(fromDateKey(habit.targetDate), locale),
        })
      : t('habit_schedule_one_time');
  return t('habit_schedule_everyday');
}

export function AllHabits() {
  const { colors } = useTheme();
  const { isRTL, locale, t } = useTranslation();
  const styles = useStyles();
  const habits = useAppStore(s => s.habits);
  const setHabitArchived = useAppStore(s => s.setHabitArchived);
  const [selected, setSelected] = useState<HabitItem>();
  const [resumingHabitId, setResumingHabitId] = useState<string>();
  const rows = useMemo<HabitHistoryRow[]>(() => {
    const result: HabitHistoryRow[] = [];
    for (const time of habitTimes) {
      const matches = habits.filter(
        habit => habit.timeOfDay === time && !habit.archived,
      );
      if (!matches.length) continue;
      result.push({
        id: `section-${time}`,
        type: 'section',
        title: t(timeTranslationKeys[time]),
      });
      for (const habit of matches)
        result.push({ id: habit.id, type: 'habit', habit });
    }
    const archived = habits.filter(habit => habit.archived);
    if (archived.length) {
      result.push({
        id: 'section-archived',
        type: 'section',
        title: t('history_archived_count', { count: archived.length }),
      });
      for (const habit of archived) {
        result.push({
          id: `archived-${habit.id}`,
          type: 'habit',
          habit,
        });
      }
    }
    return result;
  }, [habits, t]);

  const resumeHabit = async (habit: HabitItem) => {
    if (resumingHabitId) return;
    setResumingHabitId(habit.id);
    try {
      if (!(await setHabitArchived(habit.id, false))) {
        Alert.alert(
          t('history_resume_error_title'),
          t('history_resume_error_message'),
        );
      }
    } catch {
      Alert.alert(
        t('history_resume_error_title'),
        t('history_resume_error_message'),
      );
    } finally {
      setResumingHabitId(undefined);
    }
  };
  return (
    <>
      <FlashList
        data={rows}
        keyExtractor={item => item.id}
        getItemType={item => item.type}
        contentContainerStyle={styles.allHabits}
        ListHeaderComponent={
          <Text style={[styles.activeLabel, isRTL && styles.textRTL]}>
            {t('history_active_count', {
              count: habits.filter(habit => !habit.archived).length,
            })}
          </Text>
        }
        ItemSeparatorComponent={SmallVerticalListSeparator}
        renderItem={({ item }) =>
          item.type === 'section' ? (
            <Text style={[styles.groupTitle, isRTL && styles.textRTL]}>
              {item.title}
            </Text>
          ) : (
            (() => {
              const Icon = getHabitIcon(item.habit.iconName);
              return (
                <Pressable
                  onPress={() => setSelected(item.habit)}
                  style={[styles.historyHabit, isRTL && styles.rowRTL]}
                >
                  <View
                    style={[
                      styles.historyCheck,
                      {
                        backgroundColor: normalizeHabitColor(item.habit.color),
                      },
                    ]}
                  >
                    <Icon color={colors.onPrimary} size={16} />
                  </View>
                  <View style={styles.historyCopy}>
                    <Text
                      style={[styles.historyTitle, isRTL && styles.textRTL]}
                    >
                      {item.habit.title}
                    </Text>
                    <Text style={[styles.historyMeta, isRTL && styles.textRTL]}>
                      {t(
                        habitTypeTranslationKeys[
                          normalizeHabitType(item.habit.habitType)
                        ],
                      )}{' '}
                      • {localizedScheduleSummary(item.habit, t, locale)} •{' '}
                      {t('history_successful_count', {
                        count: getHabitTotalSuccesses(item.habit),
                      })}
                    </Text>
                  </View>
                  {item.habit.archived ? (
                    <Pressable
                      accessibilityLabel={t('history_resume_accessibility', {
                        title: item.habit.title,
                      })}
                      accessibilityRole="button"
                      disabled={Boolean(resumingHabitId)}
                      onPress={event => {
                        event.stopPropagation();
                        resumeHabit(item.habit).catch(() => undefined);
                      }}
                      style={[styles.resumeHabitButton, isRTL && styles.rowRTL]}
                    >
                      <RotateCcw color={colors.onPrimary} size={15} />
                      <Text
                        style={[
                          styles.resumeHabitText,
                          isRTL && styles.centeredTextRTL,
                        ]}
                      >
                        {resumingHabitId === item.habit.id
                          ? t('history_resuming')
                          : t('history_resume')}
                      </Text>
                    </Pressable>
                  ) : isRTL ? (
                    <ChevronLeft color={colors.muted} size={20} />
                  ) : (
                    <ChevronRight color={colors.muted} size={20} />
                  )}
                </Pressable>
              );
            })()
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
              accessibilityLabel={t('common_close')}
              style={[styles.modalClose, isRTL && styles.modalCloseRTL]}
              onPress={() => setSelected(undefined)}
            >
              <X color={colors.textSecondary} />
            </Pressable>
            <Text style={[styles.detailLabel, isRTL && styles.textRTL]}>
              {t('history_habit_history')}
            </Text>
            <Text style={[styles.modalTitle, isRTL && styles.textRTL]}>
              {selected?.title}
            </Text>
            <Text style={[styles.modalMetric, isRTL && styles.textRTL]}>
              {selected ? getHabitTotalSuccesses(selected) : 0}
            </Text>
            <Text style={[styles.modalCaption, isRTL && styles.textRTL]}>
              {t('history_total_completions')}
            </Text>
            <Text style={[styles.modalBody, isRTL && styles.textRTL]}>
              {selected
                ? t('history_habit_detail_description', {
                    type: t(
                      habitTypeTranslationKeys[
                        normalizeHabitType(selected.habitType)
                      ],
                    ).toLocaleLowerCase(locale),
                    time: t(timeTranslationKeys[selected.timeOfDay]),
                    schedule: localizedScheduleSummary(selected, t, locale),
                  })
                : ''}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
