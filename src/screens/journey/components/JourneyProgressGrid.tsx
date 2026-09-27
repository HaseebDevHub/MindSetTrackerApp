import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from '../../../localization';
import type { JourneyDay } from '../../../utils/journeyAnalytics';
import useStyles from './JourneyTimelineStyle';

export const JourneyProgressGrid = React.memo(function JourneyProgressGridView({
  days,
}: {
  days: JourneyDay[];
}) {
  const { t, isRTL } = useTranslation();
  const styles = useStyles();
  return (
    <View style={[styles.gridCard, isRTL && styles.rowRTL]}>
      <View style={styles.gridHeading}>
        <Text style={[styles.number, isRTL && styles.textRTL]}>
          {days.filter(day => day.finished).length}/{days.length}
        </Text>
        <Text style={[styles.secondary, isRTL && styles.textRTL]}>
          {t('journey_days_finished')}
        </Text>
      </View>
      <View style={styles.gridDivider} />
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.gridScroll}
        contentContainerStyle={[styles.grid, isRTL && styles.rowRTL]}
      >
        {days.map(day => (
          <View
            key={day.dateKey}
            accessible
            accessibilityLabel={t('journey_day_accessibility', {
              day: day.dayNumber,
              date: day.dateKey,
              completed: day.completedTaskIds.length,
              total: day.tasks.length,
              status: t(
                day.finished
                  ? 'journey_day_finished'
                  : day.status === 'current'
                  ? 'journey_day_current'
                  : day.status === 'future'
                  ? 'journey_day_future'
                  : 'journey_day_past',
              ),
            })}
            style={styles.cellWrapper}
          >
            <Text style={styles.gridDayLabel}>
              {(day.dayNumber - 1) % 5 === 0 ? day.dayNumber : ' '}
            </Text>
            {day.tasks.map(task => {
              const completed = day.completedTaskIds.includes(task.id);
              return (
                <View
                  key={task.id}
                  style={[
                    styles.cell,
                    day.status === 'current' && styles.cellCurrent,
                    completed && styles.cellFinished,
                  ]}
                >
                  {completed && <Text style={styles.cellFinishedText}>✓</Text>}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
});
