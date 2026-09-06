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
import { useTranslation, type TranslationKey } from '../../../localization';
import { achievementStorage } from '../../../storage/achievementStorage';
import { useAppStore } from '../../../store/useAppStore';
import type { AchievementCategory } from '../../../types/models';
import useStyles from '../HistoryScreenStyle';

const categoryTitleKeys: Record<AchievementCategory, TranslationKey> = {
  HABITS_FINISHED: 'history_habits_finished',
  PERFECT_DAYS: 'history_perfect_days',
  BEST_STREAK: 'history_best_streak',
};

function AchievementBadge({
  definition,
  unlocked,
}: {
  definition: AchievementDefinition;
  unlocked: boolean;
}) {
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
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
      <Text
        style={[
          styles.badgeName,
          isRTL && styles.centeredTextRTL,
          !unlocked && styles.lockedText,
        ]}
      >
        {definition.threshold}
      </Text>
      <Text style={[styles.badgeState, isRTL && styles.centeredTextRTL]}>
        {unlocked ? t('history_unlocked') : t('history_locked')}
      </Text>
    </View>
  );
}

export function Achievements() {
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
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
          <Text style={[styles.achievementTitle, isRTL && styles.textRTL]}>
            {t('history_my_achievements')}
          </Text>
          <Text style={[styles.noAchievements, isRTL && styles.textRTL]}>
            {t('history_achievements_earned', {
              percentage: earnedPercentage,
            })}
          </Text>
          <View
            style={[
              styles.achievementProgressTrack,
              isRTL && styles.achievementProgressTrackRTL,
            ]}
          >
            <View
              style={[
                styles.achievementProgressFill,
                { width: `${earnedPercentage}%` },
              ]}
            />
          </View>
          {recent.length ? (
            <>
              <Text style={[styles.recentTitle, isRTL && styles.textRTL]}>
                {t('history_recent_achievements')}
              </Text>
              <FlashList
                horizontal
                data={recent}
                inverted={isRTL}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View
                    style={[styles.recentAchievement, isRTL && styles.rowRTL]}
                  >
                    <Award color={colors.yellow} size={20} />
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.recentAchievementText,
                        isRTL && styles.textRTL,
                      ]}
                    >
                      {t(item.titleKey, { count: item.threshold })}
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
            <View
              style={[styles.achievementCategoryHeader, isRTL && styles.rowRTL]}
            >
              <Text style={[styles.groupTitle, isRTL && styles.textRTL]}>
                {t(categoryTitleKeys[category])}
              </Text>
              <Text style={[styles.achievementCount, isRTL && styles.textRTL]}>
                {t('history_unlocked_count', {
                  unlocked: unlockedCount,
                  total: definitions.length,
                })}
              </Text>
            </View>
            <Text style={[styles.categoryProgress, isRTL && styles.textRTL]}>
              {t('history_current_progress', {
                value: achievementMetric(stats, category),
              })}
            </Text>
            <FlashList
              horizontal
              data={definitions}
              inverted={isRTL}
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
