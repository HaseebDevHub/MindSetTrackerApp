import React, { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Check, MoreHorizontal } from 'lucide-react-native';
import { getHabitIcon } from '../../constants/habitIcons';
import { normalizeHabitColor } from '../../constants/habitColors';
import { useTheme } from '../../context/ThemeContext';
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
    ? `${quotaProgress.completed}/${quotaProgress.target} days this ${quotaProgress.periodLabel}`
    : goalMode === 'DURATION'
    ? `${progressValue}/${habit.goalTarget ?? 1} min`
    : goalMode === 'REPEAT'
    ? `${progressValue}/${habit.goalTarget ?? 1} reps`
    : undefined;
  return (
    <Animated.View style={[styles.card, animated]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={
          completionDisabled
            ? `Completion unavailable for ${habit.title} on a future date`
            : habitType === 'NEGATIVE'
            ? `${completed ? 'Record relapse for' : 'Undo relapse for'} ${
                habit.title
              }`
            : `${completed ? 'Mark incomplete' : 'Complete'} ${habit.title}`
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
        <View style={styles.titleRow}>
          <Icon
            color={
              completed ? colors.completedHabitForeground : colors.onPrimary
            }
            size={19}
          />
          <Text
            numberOfLines={2}
            style={[styles.title, completed && styles.completedTitle]}
          >
            {habit.title}
          </Text>
        </View>
        {completed ? (
          <View style={styles.finished}>
            <Check color={colors.completedHabitStatus} size={13} />
            <Text style={styles.finishedText}>
              {habitType === 'NEGATIVE' ? 'Avoided' : 'Finished'}
            </Text>
          </View>
        ) : (
          <Text style={styles.time}>
            {progressLabel ??
              (habitType === 'NEGATIVE'
                ? 'Relapse recorded'
                : habitType === 'ONE_TIME'
                ? 'One-time todo'
                : habit.timeOfDay)}
          </Text>
        )}
      </Pressable>
      <Pressable
        ref={menuButtonRef}
        accessibilityLabel={`Options for ${habit.title}`}
        hitSlop={10}
        onPress={openMenu}
        style={styles.menu}
      >
        <MoreHorizontal
          color={completed ? colors.completedHabitForeground : colors.onPrimary}
          size={24}
        />
      </Pressable>
    </Animated.View>
  );
});
