import React, { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Bell, Check, MoreHorizontal } from 'lucide-react-native';
import { getHabitIcon } from '../../constants/habitIcons';
import { normalizeHabitColor } from '../../constants/habitColors';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation, type TranslationKey } from '../../localization';
import type { HabitItem, WeekStartsOn } from '../../types/models';
import {
  getHabitProgressForDate,
  getHabitQuotaProgress,
} from '../../utils/habitAnalytics';
import {
  normalizeGoalMode,
  normalizeHabitType,
} from '../../utils/habitSchedule';
import useStyles from './HabitCardStyle';

export type HabitMenuAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const timeOfDayTranslationKeys: Record<HabitItem['timeOfDay'], TranslationKey> =
  {
    ANYTIME: 'habit_time_anytime',
    MORNING: 'habit_time_morning',
    AFTERNOON: 'habit_time_afternoon',
    EVENING: 'habit_time_evening',
  };

export const HabitCard = React.memo(function HabitCardComponent({
  habit,
  completed,
  completionDisabled,
  selectedDate,
  weekStartsOn,
  onToggle,
  onMenu,
  onPress,
}: {
  habit: HabitItem;
  completed: boolean;
  completionDisabled: boolean;
  selectedDate: string;
  weekStartsOn?: WeekStartsOn;
  onToggle: (habitId: string, date: string) => void;
  onMenu: (habit: HabitItem, anchor: HabitMenuAnchor) => void;
  onPress?: (habitId: string) => void;
}) {
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
  const styles = useStyles();
  const menuButtonRef = useRef<View>(null);
  const progress = useSharedValue(completed ? 1 : 0);
  // Reanimated executes animated-style callbacks on the UI runtime. Resolve
  // and validate ordinary JavaScript values before entering that worklet.
  const habitColor = normalizeHabitColor(habit.color);
  const completedColor = colors.surfaceSecondary;
  useEffect(() => {
    progress.value = withSpring(completed ? 1 : 0, {
      damping: 14,
      stiffness: 160,
    });
  }, [completed, progress]);
  const animated = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [habitColor, completedColor],
      ),
      transform: [{ scale: 1 - progress.value * 0.01 }],
    }),
    [habitColor, completedColor],
  );
  const checkAnimated = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }],
    opacity: progress.value,
  }));
  const openMenu = () => {
    menuButtonRef.current?.measureInWindow((x, y, width, height) => {
      onMenu(habit, { x, y, width, height });
    });
  };
  const Icon = getHabitIcon(habit.iconName);
  const habitType = normalizeHabitType(habit.habitType);
  const quotaProgress = getHabitQuotaProgress(
    habit,
    selectedDate,
    weekStartsOn,
  );
  const goalMode = normalizeGoalMode(habit.goalMode);
  const progressValue = getHabitProgressForDate(habit, selectedDate);
  const progressLabel = quotaProgress
    ? t('habit_progress_days', {
        completed: quotaProgress.completed,
        target: quotaProgress.target,
        period: quotaProgress.periodLabel,
      })
    : goalMode === 'DURATION'
    ? t('habit_progress_minutes', {
        completed: progressValue,
        target: habit.goalTarget ?? 1,
      })
    : goalMode === 'REPEAT'
    ? t('habit_progress_reps', {
        completed: progressValue,
        target: habit.goalTarget ?? 1,
      })
    : undefined;
  return (
    <Animated.View style={[styles.card, isRTL && styles.rowRTL, animated]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={
          completionDisabled
            ? t('habit_completion_future', { title: habit.title })
            : habitType === 'NEGATIVE'
            ? t(
                completed
                  ? 'habit_record_relapse_for'
                  : 'habit_undo_relapse_for',
                { title: habit.title },
              )
            : t(completed ? 'habit_mark_incomplete' : 'habit_complete', {
                title: habit.title,
              })
        }
        accessibilityState={{
          checked: completed,
          disabled: completionDisabled,
        }}
        disabled={completionDisabled}
        hitSlop={8}
        onPress={() => onToggle(habit.id, selectedDate)}
        style={[styles.checkbox, completionDisabled && styles.checkboxDisabled]}
      >
        {completed ? (
          <Animated.View style={checkAnimated}>
            <Check color={colors.selectedBlue} size={17} strokeWidth={3} />
          </Animated.View>
        ) : null}
      </Pressable>
      <Pressable onPress={() => onPress?.(habit.id)} style={styles.copy}>
        <View style={[styles.titleRow, isRTL && styles.rowRTL]}>
          <Icon
            color={
              completed ? colors.completedHabitForeground : colors.onPrimary
            }
            size={19}
          />
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              isRTL && styles.textRTL,
              completed && styles.completedTitle,
            ]}
          >
            {habit.title}
          </Text>
          {habit.reminderEnabled ? (
            <View
              accessible
              accessibilityLabel={t('habit_reminder_enabled_accessibility')}
              style={styles.reminderIndicator}
            >
              <Bell
                color={
                  completed ? colors.completedHabitForeground : colors.onPrimary
                }
                size={15}
              />
            </View>
          ) : null}
        </View>
        {completed ? (
          <View style={[styles.finished, isRTL && styles.rowRTL]}>
            <Check color={colors.completedHabitStatus} size={13} />
            <Text style={[styles.finishedText, isRTL && styles.textRTL]}>
              {t(
                habitType === 'NEGATIVE'
                  ? 'habit_status_avoided'
                  : 'habit_status_finished',
              )}
            </Text>
          </View>
        ) : (
          <Text style={[styles.time, isRTL && styles.textRTL]}>
            {progressLabel ??
              (habitType === 'NEGATIVE'
                ? t('habit_status_relapse')
                : habitType === 'ONE_TIME'
                ? t('habit_status_one_time')
                : t(timeOfDayTranslationKeys[habit.timeOfDay]))}
          </Text>
        )}
      </Pressable>
      <Pressable
        ref={menuButtonRef}
        accessibilityLabel={t('habit_options', { title: habit.title })}
        hitSlop={10}
        onPress={openMenu}
        style={[styles.menu, isRTL && styles.menuRTL]}
      >
        <MoreHorizontal
          color={completed ? colors.completedHabitForeground : colors.onPrimary}
          size={24}
        />
      </Pressable>
    </Animated.View>
  );
});
