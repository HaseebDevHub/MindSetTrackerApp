import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  BookOpen,
  Brain,
  Check,
  Droplets,
  Footprints,
  MoreHorizontal,
  Moon,
  Sparkles,
} from 'lucide-react-native';
import { colors } from '../../constants/theme';
import type { HabitItem } from '../../types/models';
import styles from './HabitCardStyle';

const iconMap = { Droplets, Footprints, BookOpen, Brain, Moon, Sparkles };

export function HabitCard({
  habit,
  completed,
  onToggle,
  onMenu,
  onPress,
}: {
  habit: HabitItem;
  completed: boolean;
  onToggle: () => void;
  onMenu: () => void;
  onPress?: () => void;
}) {
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
      [colors.selectedBlue, colors.darkBlue],
    ),
    transform: [{ scale: 1 - progress.value * 0.01 }],
  }));
  const checkAnimated = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }],
    opacity: progress.value,
  }));
  const Icon = iconMap[habit.iconName as keyof typeof iconMap] ?? Sparkles;
  return (
    <Animated.View style={[styles.card, animated]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${completed ? 'Mark incomplete' : 'Complete'} ${
          habit.title
        }`}
        accessibilityState={{ checked: completed }}
        hitSlop={8}
        onPress={onToggle}
        style={styles.checkbox}
      >
        {completed ? (
          <Animated.View style={checkAnimated}>
            <Check color={colors.selectedBlue} size={17} strokeWidth={3} />
          </Animated.View>
        ) : null}
      </Pressable>
      <Pressable onPress={onPress} style={styles.copy}>
        <View style={styles.titleRow}>
          <Icon color={colors.text} size={19} />
          <Text
            numberOfLines={2}
            style={[styles.title, completed && styles.completedTitle]}
          >
            {habit.title}
          </Text>
        </View>
        {completed ? (
          <View style={styles.finished}>
            <Check color="#BFDBFE" size={13} />
            <Text style={styles.finishedText}>Finished</Text>
          </View>
        ) : (
          <Text style={styles.time}>{habit.timeOfDay}</Text>
        )}
      </Pressable>
      <Pressable
        accessibilityLabel={`Options for ${habit.title}`}
        hitSlop={10}
        onPress={onMenu}
        style={styles.menu}
      >
        <MoreHorizontal color={colors.text} size={24} />
      </Pressable>
    </Animated.View>
  );
}
