import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
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
  const days = getCalendarDays(month, weekStartsOn);
  const calendarCellSize = (width - 72) / 7;
  const renderDay = ({ item: date }: { item: Date | null }) => {
    if (!date)
      return <View style={[styles.day, { width: calendarCellSize }]} />;
    const key = toDateKey(date);
    const selected = selectedDate === key;
    const progress = getDailyProgress(habits, key);
    return (
      <Pressable
        accessibilityLabel={date.toDateString()}
        onPress={() => {
          setSelectedDate(key);
          onDateSelected?.(key);
        }}
        style={[
          styles.day,
          { width: calendarCellSize },
          progress.percentage > 0 && styles.partialDay,
          progress.isPerfect && styles.perfectDay,
          selected && styles.selectedDay,
        ]}
      >
        <Text style={[styles.dayText, selected && styles.selectedDayText]}>
          {date.getDate()}
        </Text>
        {progress.percentage > 0 ? (
          <View
            style={[
              styles.dot,
              progress.isPerfect && styles.dotPerfect,
              selected && styles.dotSelected,
            ]}
          />
        ) : null}
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
            Yellow marks partial progress. Green marks a perfect day.
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
