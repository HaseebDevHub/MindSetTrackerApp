import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { HorizontalListSeparator } from '../../../components/common/ListSeparator';
import { useTheme } from '../../../context/ThemeContext';
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
const PROGRESS_RING_RADIUS =
  (PROGRESS_RING_SIZE - PROGRESS_RING_STROKE) / 2;
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;

export function CalendarHistory({
  onDateSelected,
}: {
  onDateSelected?: (dateKey: string) => void;
}) {
  const { colors } = useTheme();
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
      title: 'CURRENT STREAK',
      value: String(stats.currentStreak),
      caption: `Best Streak: ${stats.bestStreak}`,
      color: colors.selectedBlue,
    },
    {
      title: 'HABITS FINISHED',
      value: String(stats.habitsFinishedTotal),
      caption: `Selected week: ${selectedWeek.achieved}`,
      color: colors.red,
    },
    {
      title: 'COMPLETION RATE',
      value: `${selectedWeek.percentage}%`,
      caption: `${selectedWeek.achieved}/${selectedWeek.target} progress`,
      color: colors.yellow,
    },
    {
      title: 'PERFECT DAYS',
      value: String(stats.perfectDays),
      caption: `Selected week: ${selectedWeek.days.filter(day => day.isPerfect).length}`,
      color: colors.green,
    },
  ];
  const weekLabels = getWeekdayLabels(weekStartsOn);
  const days = useMemo(
    () => getCalendarDays(month, weekStartsOn),
    [month, weekStartsOn],
  );
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
    const previousDate = index % 7 === 0 ? null : days[index - 1];
    const nextDate = index % 7 === 6 ? null : days[index + 1];
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
        accessibilityLabel={date.toDateString()}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityValue={{
          min: 0,
          max: 100,
          now: progress.percentage,
          text: `${progress.percentage}% complete`,
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
      data={[monthTitle(month)]}
      keyExtractor={keyByValue}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      ListHeaderComponent={
        <FlashList
          horizontal
          data={metrics}
          renderItem={({ item: metric }) => (
            <View style={[styles.metric, { backgroundColor: metric.color }]}>
              <Text style={styles.metricTitle}>{metric.title}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricCaption}>{metric.caption}</Text>
            </View>
          )}
          keyExtractor={keyByTitle}
          ItemSeparatorComponent={HorizontalListSeparator}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricRow}
          style={styles.metricList}
        />
      }
      renderItem={() => (
        <View style={styles.calendar}>
          <View style={styles.calendarTop}>
            <Pressable
              accessibilityLabel="Previous month"
              onPress={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
            >
              <ChevronLeft color={colors.text} />
            </Pressable>
            <Text style={styles.month}>{monthTitle(month)}</Text>
            <Pressable
              accessibilityLabel="Next month"
              onPress={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
            >
              <ChevronRight color={colors.text} />
            </Pressable>
          </View>
          <FlashList
            horizontal
            data={weekLabels}
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
            data={days}
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
          <Text style={styles.legend}>
            Rings show daily progress. Connected blue days are perfect streaks.
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
