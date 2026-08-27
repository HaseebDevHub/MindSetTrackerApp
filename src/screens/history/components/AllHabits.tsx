import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Check, ChevronRight, X } from 'lucide-react-native';
import { SmallVerticalListSeparator } from '../../../components/common/ListSeparator';
import { useTheme } from '../../../context/ThemeContext';
import { useAppStore } from '../../../store/useAppStore';
import type { HabitItem } from '../../../types/models';
import { calculateHabitStreak } from '../../../utils/habitAnalytics';
import useStyles from '../HistoryScreenStyle';

type HabitHistoryRow =
  | { id: string; type: 'section'; title: string }
  | { id: string; type: 'habit'; habit: HabitItem };

export function AllHabits() {
  const { colors } = useTheme();
  const styles = useStyles();
  const habits = useAppStore(s => s.habits);
  const [selected, setSelected] = useState<HabitItem>();
  const rows = useMemo<HabitHistoryRow[]>(() => {
    const result: HabitHistoryRow[] = [];
    for (const time of ['ANYTIME', 'MORNING', 'AFTERNOON', 'EVENING']) {
      const matches = habits.filter(
        habit => habit.timeOfDay === time && !habit.archived,
      );
      if (!matches.length) continue;
      result.push({ id: `section-${time}`, type: 'section', title: time });
      for (const habit of matches)
        result.push({ id: habit.id, type: 'habit', habit });
    }
    return result;
  }, [habits]);
  return (
    <>
      <FlashList
        data={rows}
        keyExtractor={item => item.id}
        getItemType={item => item.type}
        contentContainerStyle={styles.allHabits}
        ListHeaderComponent={
          <Text style={styles.activeLabel}>
            ACTIVE ({habits.filter(h => !h.archived).length})
          </Text>
        }
        ItemSeparatorComponent={SmallVerticalListSeparator}
        renderItem={({ item }) =>
          item.type === 'section' ? (
            <Text style={styles.groupTitle}>{item.title}</Text>
          ) : (
            <Pressable
              onPress={() => setSelected(item.habit)}
              style={styles.historyHabit}
            >
              <View style={styles.historyCheck}>
                <Check color={colors.primary} size={16} />
              </View>
              <View style={styles.historyCopy}>
                <Text style={styles.historyTitle}>{item.habit.title}</Text>
                <Text style={styles.historyMeta}>
                  {item.habit.frequency === 'WEEKDAYS'
                    ? 'Weekdays'
                    : 'Every day'}{' '}
                  • {item.habit.completedDates.length} completions •{' '}
                  {calculateHabitStreak(item.habit)} day streak
                </Text>
              </View>
              <ChevronRight color={colors.muted} size={20} />
            </Pressable>
          )
        }
      />
      <Modal
        transparent
        visible={Boolean(selected)}
        animationType="fade"
        onRequestClose={() => setSelected(undefined)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelected(undefined)}
        >
          <Pressable
            style={styles.habitModal}
            onPress={event => event.stopPropagation()}
          >
            <Pressable
              style={styles.modalClose}
              onPress={() => setSelected(undefined)}
            >
              <X color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.detailLabel}>HABIT HISTORY</Text>
            <Text style={styles.modalTitle}>{selected?.title}</Text>
            <Text style={styles.modalMetric}>
              {selected?.completedDates.length ?? 0}
            </Text>
            <Text style={styles.modalCaption}>TOTAL COMPLETIONS</Text>
            <Text style={styles.modalBody}>
              This habit is scheduled for {selected?.timeOfDay.toLowerCase()}.
              Frequency:{' '}
              {selected?.frequency === 'WEEKDAYS' ? 'weekdays' : 'every day'}.
              Edit it from the Today tab.
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
