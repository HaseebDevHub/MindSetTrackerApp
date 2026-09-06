import React from 'react';
import { Image, Text, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { journeyImages } from '../../../data/journeyImages';
import { useTranslation } from '../../../localization';
import type { ActiveJourneyItem, Journey } from '../../../types/models';
import { toDateKey } from '../../../utils/dates';
import { getJourneyMetrics } from '../../../utils/journeyAnalytics';
import useStyles from './ActiveJourneyCardStyle';

export function ActiveJourneyCard({
  enrollment,
  journey,
}: {
  enrollment: ActiveJourneyItem;
  journey: Journey;
}) {
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
  const styles = useStyles();
  const metrics = getJourneyMetrics(enrollment, journey, toDateKey(new Date()));

  return (
    <View style={[styles.card, { backgroundColor: journey.colors[0] }]}>
      <Image
        resizeMode="cover"
        source={journeyImages[journey.id]}
        style={styles.image}
      />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <View style={[styles.topRow, isRTL && styles.rowRTL]}>
          <Text style={[styles.status, isRTL && styles.textRTL]}>
            {metrics.isCompleted
              ? t('journey_card_completed')
              : t('journey_card_day', { day: metrics.dayNumber })}
          </Text>
          <Text style={styles.percentage}>{metrics.percentage}%</Text>
        </View>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            isRTL && styles.textRTL,
            isRTL && styles.titleRTL,
          ]}
        >
          {t(journey.titleKey)}
        </Text>
        <View style={[styles.progressTrack, isRTL && styles.progressTrackRTL]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.onPrimary,
                width: `${metrics.percentage}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressCopy, isRTL && styles.textRTL]}>
          {t('journey_card_today', {
            completed: metrics.completedToday,
            total: metrics.totalTasks,
          })}
        </Text>
      </View>
    </View>
  );
}
