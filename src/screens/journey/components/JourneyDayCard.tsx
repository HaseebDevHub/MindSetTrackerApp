import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LockKeyhole,
} from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from '../../../localization';
import { fromDateKey } from '../../../utils/dates';
import type { JourneyDay } from '../../../utils/journeyAnalytics';
import { JourneyTaskRow } from './JourneyTaskRow';
import useStyles from './JourneyTimelineStyle';

type Props = {
  day: JourneyDay;
  expanded: boolean;
  pendingIds: string;
  readOnly: boolean;
  onExpand: (day: number) => void;
  onToggle: (taskId: string, dateKey: string) => void;
};

export const JourneyDayCard = React.memo(
  function JourneyDayCardView({
    day,
    expanded,
    pendingIds,
    readOnly,
    onExpand,
    onToggle,
  }: Props) {
    const { t, locale, isRTL } = useTranslation();
    const { colors } = useTheme();
    const styles = useStyles();
    const calendarDate = fromDateKey(day.dateKey);
    const month = calendarDate
      .toLocaleDateString(locale, { month: 'short' })
      .toLocaleUpperCase(locale);
    const dayOfMonth = calendarDate.toLocaleDateString(locale, {
      day: 'numeric',
    });
    const date = calendarDate.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const status = t(
      day.status === 'current'
        ? 'journey_day_current'
        : day.status === 'future'
        ? 'journey_day_future'
        : 'journey_day_past',
    );
    const pending = pendingIds.split('|');
    return (
      <View style={[styles.card, day.status === 'current' && styles.current]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={t('journey_day_accessibility', {
            day: day.dayNumber,
            date,
            completed: day.completedTaskIds.length,
            total: day.tasks.length,
            status: `${status}${
              day.finished ? `, ${t('journey_day_finished')}` : ''
            }`,
          })}
          onPress={() => onExpand(day.dayNumber)}
          style={[styles.header, isRTL && styles.rowRTL]}
        >
          <View style={styles.dateColumn}>
            <Text style={styles.dateMonth}>{month}</Text>
            <Text style={styles.dateDay}>{dayOfMonth}</Text>
          </View>
          <View style={styles.copy}>
            <Text style={[styles.title, isRTL && styles.textRTL]}>
              {t('journey_day_label', { day: day.dayNumber })}
            </Text>
            <Text style={[styles.secondary, isRTL && styles.textRTL]}>
              {t('journey_tasks_completed', {
                completed: day.completedTaskIds.length,
                total: day.tasks.length,
              })}
            </Text>
            {day.status !== 'future' && (
              <Text style={[styles.status, isRTL && styles.textRTL]}>
                {status}
              </Text>
            )}
          </View>
          {day.finished ? (
            <CheckCircle2 color={colors.primary} size={22} />
          ) : day.status === 'future' ? (
            <LockKeyhole color={colors.textSecondary} size={18} />
          ) : null}
          {expanded ? (
            <ChevronUp color={colors.textSecondary} size={22} />
          ) : (
            <ChevronDown color={colors.textSecondary} size={22} />
          )}
        </Pressable>
        {expanded && (
          <View style={styles.body}>
            {day.status !== 'current' && (
              <Text style={[styles.secondary, isRTL && styles.textRTL]}>
                {status}
              </Text>
            )}
            {day.tasks.map(task => (
              <JourneyTaskRow
                key={task.id}
                task={task}
                dateKey={day.dateKey}
                completed={day.completedTaskIds.includes(task.id)}
                disabled={readOnly || day.status !== 'current'}
                pending={pending.includes(task.id)}
                onToggle={onToggle}
              />
            ))}
          </View>
        )}
      </View>
    );
  },
  (a, b) =>
    a.expanded === b.expanded &&
    a.pendingIds === b.pendingIds &&
    a.readOnly === b.readOnly &&
    a.onExpand === b.onExpand &&
    a.onToggle === b.onToggle &&
    a.day.dateKey === b.day.dateKey &&
    a.day.dayNumber === b.day.dayNumber &&
    a.day.status === b.day.status &&
    a.day.finished === b.day.finished &&
    a.day.completedTaskIds.join('|') === b.day.completedTaskIds.join('|') &&
    a.day.tasks.length === b.day.tasks.length &&
    a.day.tasks.every((task, i) => task === b.day.tasks[i]),
);
