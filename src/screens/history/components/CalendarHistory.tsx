import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { HorizontalListSeparator } from '../../../components/common/ListSeparator';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from '../../../localization';
import { useAppStore } from '../../../store/useAppStore';
import {
  fromDateKey,
  getCalendarDays,
  getWeekdayLabels,
  monthTitle,
  toDateKey,
} from '../../../utils/dates';
import {
  calculateSelectedWeekMetrics,
  getDailyProgress,
} from '../../../utils/habitAnalytics';
import { keyByTitle, keyByValue } from '../../../utils/lists';
import useStyles from '../HistoryScreenStyle';
import { WeeklyProgress } from './WeeklyProgress';

const PROGRESS_RING_SIZE = 38;
const PROGRESS_RING_STROKE = 4;
const PROGRESS_RING_RADIUS = (PROGRESS_RING_SIZE - PROGRESS_RING_STROKE) / 2;
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;

export function CalendarHistory({
  onDateSelected,
}: {
  onDateSelected?: (dateKey: string) => void;
}) {
  const { colors } = useTheme();
  const { isRTL, locale, t } = useTranslation();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const habits = useAppStore(s => s.habits);
  const stats = useAppStore(s => s.stats);
  const selectedDate = useAppStore(s => s.selectedDate);
  const setSelectedDate = useAppStore(s => s.setSelectedDate);
  const weekStartsOn = useAppStore(s => s.weekStartsOn);
  const [month, setMonth] = useState(() => fromDateKey(selectedDate));

  useEffect(() => {
    const nextMonth = fromDateKey(selectedDate);
    setMonth(current =>
      current.getFullYear() === nextMonth.getFullYear() &&
      current.getMonth() === nextMonth.getMonth()
        ? current
        : nextMonth,
    );
  }, [selectedDate]);
  const selectedWeek = calculateSelectedWeekMetrics(
    habits,
    selectedDate,
    weekStartsOn,
  );
  const metrics = [
    {
      title: t('history_current_streak'),
      value: String(stats.currentStreak),
      caption: t('history_best_streak_value', { value: stats.bestStreak }),
      color: colors.selectedBlue,
    },
    {
      title: t('history_habits_finished'),
      value: String(stats.habitsFinishedTotal),
      caption: t('history_selected_week_value', {
        value: selectedWeek.achieved,
      }),
      color: colors.red,
    },
    {
      title: t('history_completion_rate'),
      value: `${selectedWeek.percentage}%`,
      caption: t('history_progress_fraction', {
        achieved: selectedWeek.achieved,
        target: selectedWeek.target,
      }),
      color: colors.yellow,
    },
    {
      title: t('history_perfect_days'),
      value: String(stats.perfectDays),
      caption: t('history_selected_week_value', {
        value: selectedWeek.days.filter(day => day.isPerfect).length,
      }),
      color: colors.green,
    },
  ];
  const weekLabels = getWeekdayLabels(weekStartsOn, locale);
  const days = useMemo(
    () => getCalendarDays(month, weekStartsOn),
    [month, weekStartsOn],
  );
  const displayedWeekLabels = isRTL ? [...weekLabels].reverse() : weekLabels;
  const displayedDays = useMemo(() => {
    if (!isRTL) return days;
    const rows: (Date | null)[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      rows.push(days.slice(index, index + 7).reverse());
    }
    return rows.flat();
  }, [days, isRTL]);
  const progressByDate = useMemo(
    () =>
      new Map(
        days.flatMap(date => {
          if (!date) return [];
          const key = toDateKey(date);
          return [[key, getDailyProgress(habits, key)] as const];
        }),
      ),
    [days, habits],
  );
  const calendarCellSize = (width - 72) / 7;
  const renderDay = ({
    item: date,
    index,
  }: {
    item: Date | null;
    index: number;
  }) => {
    if (!date)
      return <View style={[styles.day, { width: calendarCellSize }]} />;
    const key = toDateKey(date);
    const selected = selectedDate === key;
    const progress = progressByDate.get(key)!;
    const previousDate = index % 7 === 0 ? null : displayedDays[index - 1];
    const nextDate = index % 7 === 6 ? null : displayedDays[index + 1];
    const connectsLeft = Boolean(
      progress.isPerfect &&
        previousDate &&
        progressByDate.get(toDateKey(previousDate))?.isPerfect,
    );
    const connectsRight = Boolean(
      progress.isPerfect &&
        nextDate &&
        progressByDate.get(toDateKey(nextDate))?.isPerfect,
    );
    const isPartial = progress.percentage > 0 && !progress.isPerfect;
    const progressOffset =
      PROGRESS_RING_CIRCUMFERENCE * (1 - progress.percentage / 100);
    return (
      <Pressable
        accessibilityLabel={date.toLocaleDateString(locale, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityValue={{
          min: 0,
          max: 100,
          now: progress.percentage,
          text: t('history_percent_complete', {
            percentage: progress.percentage,
          }),
        }}
        onPress={() => {
          setSelectedDate(key);
          onDateSelected?.(key);
        }}
        style={[styles.day, { width: calendarCellSize }]}
        testID={`calendar-day-${key}`}
      >
        {connectsLeft ? (
          <View
            pointerEvents="none"
            style={[styles.streakConnector, styles.streakConnectorLeft]}
            testID={`calendar-streak-left-${key}`}
          />
        ) : null}
        {connectsRight ? (
          <View
            pointerEvents="none"
            style={[styles.streakConnector, styles.streakConnectorRight]}
            testID={`calendar-streak-right-${key}`}
          />
        ) : null}
        <View
          pointerEvents="none"
          style={[
            styles.dayMarker,
            progress.isPerfect && styles.perfectDayMarker,
            selected && styles.selectedDayOutline,
          ]}
          testID={`calendar-marker-${key}`}
        >
          {isPartial ? (
            <Svg
              pointerEvents="none"
              width={PROGRESS_RING_SIZE}
              height={PROGRESS_RING_SIZE}
              viewBox={`0 0 ${PROGRESS_RING_SIZE} ${PROGRESS_RING_SIZE}`}
              style={styles.progressRing}
              testID={`calendar-partial-${key}`}
            >
              <Circle
                cx={PROGRESS_RING_SIZE / 2}
                cy={PROGRESS_RING_SIZE / 2}
                r={PROGRESS_RING_RADIUS}
                fill="none"
                stroke={colors.divider}
                strokeWidth={PROGRESS_RING_STROKE}
              />
              <Circle
                cx={PROGRESS_RING_SIZE / 2}
                cy={PROGRESS_RING_SIZE / 2}
                r={PROGRESS_RING_RADIUS}
                fill="none"
                rotation="-90"
                origin={`${PROGRESS_RING_SIZE / 2}, ${PROGRESS_RING_SIZE / 2}`}
                stroke={colors.primary}
                strokeDasharray={`${PROGRESS_RING_CIRCUMFERENCE} ${PROGRESS_RING_CIRCUMFERENCE}`}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                strokeWidth={PROGRESS_RING_STROKE}
              />
            </Svg>
          ) : null}
          <Text
            style={[
              styles.dayText,
              isPartial && styles.progressDayText,
              progress.isPerfect && styles.perfectDayText,
            ]}
          >
            {date.getDate()}
          </Text>
        </View>
      </Pressable>
    );
  };
  return (
    <FlashList
      data={[monthTitle(month, locale)]}
      keyExtractor={keyByValue}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      ListHeaderComponent={
        <FlashList
          horizontal
          data={metrics}
          inverted={isRTL}
          renderItem={({ item: metric }) => (
            <View
              style={[
                styles.metric,
                isRTL && styles.metricRTLSpacing,
                { backgroundColor: metric.color },
              ]}
            >
              <Text style={[styles.metricTitle, isRTL && styles.textRTL]}>
                {metric.title}
              </Text>
              <Text style={[styles.metricValue, isRTL && styles.numericRTL]}>
                {metric.value}
              </Text>
              <Text style={[styles.metricCaption, isRTL && styles.textRTL]}>
                {metric.caption}
              </Text>
            </View>
          )}
          keyExtractor={keyByTitle}
          ItemSeparatorComponent={isRTL ? undefined : HorizontalListSeparator}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricRow}
          style={styles.metricList}
        />
      }
      renderItem={() => (
        <View style={styles.calendar}>
          <View style={[styles.calendarTop, isRTL && styles.rowRTL]}>
            <Pressable
              accessibilityLabel={t('history_previous_month')}
              onPress={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
            >
              {isRTL ? (
                <ChevronRight color={colors.text} />
              ) : (
                <ChevronLeft color={colors.text} />
              )}
            </Pressable>
            <Text style={[styles.month, isRTL && styles.centeredTextRTL]}>
              {monthTitle(month, locale)}
            </Text>
            <Pressable
              accessibilityLabel={t('history_next_month')}
              onPress={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
            >
              {isRTL ? (
                <ChevronLeft color={colors.text} />
              ) : (
                <ChevronRight color={colors.text} />
              )}
            </Pressable>
          </View>
          <FlashList
            horizontal
            data={displayedWeekLabels}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <Text
                accessibilityLabel={item.long}
                style={[styles.weekLabel, { width: calendarCellSize }]}
              >
                {item.short}
              </Text>
            )}
            scrollEnabled={false}
            style={styles.week}
          />
          <FlashList
            data={displayedDays}
            numColumns={7}
            keyExtractor={(date, index) =>
              date ? toDateKey(date) : `blank-${index}`
            }
            renderItem={renderDay}
            scrollEnabled={false}
            style={{ height: Math.ceil(days.length / 7) * calendarCellSize }}
          />
        </View>
      )}
      ListFooterComponent={
        <>
          <Text style={[styles.legend, isRTL && styles.centeredTextRTL]}>
            {t('history_calendar_legend')}
          </Text>
          <WeeklyProgress
            selectedDate={selectedDate}
            weekStartsOn={weekStartsOn}
          />
        </>
      }
    />
  );
}
