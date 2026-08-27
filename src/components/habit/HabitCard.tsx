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
import { useTheme } from '../../context/ThemeContext';
import type { HabitItem } from '../../types/models';
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
  selectedDate,
  onToggle,
  onMenu,
  onPress,
}: {
  habit: HabitItem;
  completed: boolean;
  selectedDate: string;
  onToggle: (habitId: string, date: string) => void;
  onMenu: (habit: HabitItem, anchor: HabitMenuAnchor) => void;
  onPress?: (habitId: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const menuButtonRef = useRef<View>(null);
  const progress = useSharedValue(completed ? 1 : 0);
  useEffect(() => {
    progress.value = withSpring(completed ? 1 : 0, {
      damping: 14,
      stiffness: 160,
    });
  }, [completed, progress]);
  const animated = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.selectedBlue, colors.surfaceSecondary],
    ),
    transform: [{ scale: 1 - progress.value * 0.01 }],
  }));
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
  return (
    <Animated.View style={[styles.card, animated]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${completed ? 'Mark incomplete' : 'Complete'} ${
          habit.title
        }`}
        accessibilityState={{ checked: completed }}
        hitSlop={8}
        onPress={() => onToggle(habit.id, selectedDate)}
        style={styles.checkbox}
      >
        {completed ? (
          <Animated.View style={checkAnimated}>
            <Check color={colors.selectedBlue} size={17} strokeWidth={3} />
          </Animated.View>
        ) : null}
      </Pressable>
      <Pressable onPress={() => onPress?.(habit.id)} style={styles.copy}>
        <View style={styles.titleRow}>
          <Icon color={colors.onPrimary} size={19} />
          <Text
            numberOfLines={2}
            style={[styles.title, completed && styles.completedTitle]}
          >
            {habit.title}
          </Text>
        </View>
        {completed ? (
          <View style={styles.finished}>
            <Check color={colors.onPrimaryFaint} size={13} />
            <Text style={styles.finishedText}>Finished</Text>
          </View>
        ) : (
          <Text style={styles.time}>{habit.timeOfDay}</Text>
        )}
      </Pressable>
      <Pressable
        ref={menuButtonRef}
        accessibilityLabel={`Options for ${habit.title}`}
        hitSlop={10}
        onPress={openMenu}
        style={styles.menu}
      >
        <MoreHorizontal color={colors.onPrimary} size={24} />
      </Pressable>
    </Animated.View>
  );
});
