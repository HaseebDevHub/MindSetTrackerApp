import React from 'react';
import { Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Award, Check, Flame, Lock, Target, Trophy } from 'lucide-react-native';
import { SmallVerticalListSeparator } from '../../../components/common/ListSeparator';
import { useTheme } from '../../../context/ThemeContext';
import { useAppStore } from '../../../store/useAppStore';
import { keyByName } from '../../../utils/lists';
import useStyles from '../HistoryScreenStyle';

const badgeData = [
  { name: 'Finish Habit for The First Time', goal: 1, icon: Check },
  { name: '10 Times', goal: 10, icon: Trophy },
  { name: '20 Times', goal: 20, icon: Award },
  { name: '3 Perfect Days', goal: 3, icon: Target },
  { name: '3 Days Streak', goal: 3, icon: Flame },
  { name: '7 Days Streak', goal: 7, icon: Flame },
];

export function Achievements() {
  const { colors } = useTheme();
  const styles = useStyles();
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
                  <Icon color={colors.onPrimary} size={28} />
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
