import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Award, Check, Flame, Lock, Target, Trophy } from 'lucide-react-native';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  achievementMetric,
  type AchievementDefinition,
} from '../../../constants/achievements';
import { SmallVerticalListSeparator } from '../../../components/common/ListSeparator';
import { useTheme } from '../../../context/ThemeContext';
import { achievementStorage } from '../../../storage/achievementStorage';
import { useAppStore } from '../../../store/useAppStore';
import type { AchievementCategory } from '../../../types/models';
import useStyles from '../HistoryScreenStyle';

const categoryTitles: Record<AchievementCategory, string> = {
  HABITS_FINISHED: 'HABITS FINISHED',
  PERFECT_DAYS: 'PERFECT DAYS',
  BEST_STREAK: 'BEST STREAK',
};

function AchievementBadge({
  definition,
  unlocked,
}: {
  definition: AchievementDefinition;
  unlocked: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const Icon =
    definition.category === 'HABITS_FINISHED'
      ? definition.threshold === 1
        ? Check
        : Trophy
      : definition.category === 'PERFECT_DAYS'
      ? Target
      : Flame;
  return (
    <View style={styles.badgeCard}>
      <View style={[styles.badgeCircle, unlocked && styles.badgeUnlocked]}>
        {unlocked ? (
          <Icon color={colors.onPrimary} size={25} />
        ) : (
          <Lock color={colors.muted} size={22} />
        )}
      </View>
      <Text style={[styles.badgeName, !unlocked && styles.lockedText]}>
        {definition.threshold}
      </Text>
      <Text style={styles.badgeState}>{unlocked ? 'UNLOCKED' : 'LOCKED'}</Text>
    </View>
  );
}

export function Achievements() {
  const { colors } = useTheme();
  const styles = useStyles();
  const stats = useAppStore(state => state.stats);
  const unlockedIds = stats.unlockedAchievements;
  const unlockedSet = useMemo(() => new Set(unlockedIds), [unlockedIds]);
  const recent = achievementStorage
    .getUnlocks()
    .slice(0, 5)
    .flatMap(unlock => {
      const definition = ACHIEVEMENTS.find(item => item.id === unlock.id);
      return definition ? [definition] : [];
    });
  const earnedPercentage = Math.round(
    (unlockedIds.length / ACHIEVEMENTS.length) * 100,
  );

  return (
    <FlashList
      data={ACHIEVEMENT_CATEGORIES}
      keyExtractor={category => category}
      contentContainerStyle={styles.achievements}
      ItemSeparatorComponent={SmallVerticalListSeparator}
      ListHeaderComponent={
        <View style={styles.achievementHeader}>
          <Text style={styles.achievementTitle}>My achievements</Text>
          <Text style={styles.noAchievements}>
            You've earned {earnedPercentage}% of all achievements.
          </Text>
          <View style={styles.achievementProgressTrack}>
            <View
              style={[
                styles.achievementProgressFill,
                { width: `${earnedPercentage}%` },
              ]}
            />
          </View>
          {recent.length ? (
            <>
              <Text style={styles.recentTitle}>RECENT ACHIEVEMENTS</Text>
              <FlashList
                horizontal
                data={recent}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.recentAchievement}>
                    <Award color={colors.yellow} size={20} />
                    <Text
                      numberOfLines={2}
                      style={styles.recentAchievementText}
                    >
                      {item.title}
                    </Text>
                  </View>
                )}
              />
            </>
          ) : null}
        </View>
      }
      renderItem={({ item: category }) => {
        const definitions = ACHIEVEMENTS.filter(
          definition => definition.category === category,
        );
        const unlockedCount = definitions.filter(definition =>
          unlockedSet.has(definition.id),
        ).length;
        return (
          <View style={styles.achievementCategory}>
            <View style={styles.achievementCategoryHeader}>
              <Text style={styles.groupTitle}>{categoryTitles[category]}</Text>
              <Text style={styles.achievementCount}>
                {unlockedCount}/{definitions.length} Unlocked
              </Text>
            </View>
            <Text style={styles.categoryProgress}>
              Current progress: {achievementMetric(stats, category)}
            </Text>
            <FlashList
              horizontal
              data={definitions}
              keyExtractor={definition => definition.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item: definition }) => (
                <AchievementBadge
                  definition={definition}
                  unlocked={unlockedSet.has(definition.id)}
                />
              )}
            />
          </View>
        );
      }}
    />
  );
}
