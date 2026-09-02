import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ChevronRight, RotateCcw, X } from 'lucide-react-native';
import { SmallVerticalListSeparator } from '../../../components/common/ListSeparator';
import { getHabitIcon } from '../../../constants/habitIcons';
import { normalizeHabitColor } from '../../../constants/habitColors';
import { useTheme } from '../../../context/ThemeContext';
import { useAppStore } from '../../../store/useAppStore';
import type { HabitItem } from '../../../types/models';
import { getHabitTotalSuccesses } from '../../../utils/habitAnalytics';
import {
  getHabitScheduleSummary,
  normalizeHabitType,
} from '../../../utils/habitSchedule';
import useStyles from '../HistoryScreenStyle';

type HabitHistoryRow =
  | { id: string; type: 'section'; title: string }
  | { id: string; type: 'habit'; habit: HabitItem };

export function AllHabits() {
  const { colors } = useTheme();
  const styles = useStyles();
  const habits = useAppStore(s => s.habits);
  const setHabitArchived = useAppStore(s => s.setHabitArchived);
  const [selected, setSelected] = useState<HabitItem>();
  const [resumingHabitId, setResumingHabitId] = useState<string>();
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
    const archived = habits.filter(habit => habit.archived);
    if (archived.length) {
      result.push({
        id: 'section-archived',
        type: 'section',
        title: `ARCHIVED (${archived.length})`,
      });
      for (const habit of archived) {
        result.push({
          id: `archived-${habit.id}`,
          type: 'habit',
          habit,
        });
      }
    }
    return result;
  }, [habits]);

  const resumeHabit = async (habit: HabitItem) => {
    if (resumingHabitId) return;
    setResumingHabitId(habit.id);
    try {
      if (!(await setHabitArchived(habit.id, false))) {
        Alert.alert(
          'Unable to resume habit',
          'The habit could not be resumed. Please try again.',
        );
      }
    } catch {
      Alert.alert(
        'Unable to resume habit',
        'The habit could not be resumed. Please try again.',
      );
    } finally {
      setResumingHabitId(undefined);
    }
  };
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
            (() => {
              const Icon = getHabitIcon(item.habit.iconName);
              return (
                <Pressable
                  onPress={() => setSelected(item.habit)}
                  style={styles.historyHabit}
                >
                  <View
                    style={[
                      styles.historyCheck,
                      {
                        backgroundColor: normalizeHabitColor(item.habit.color),
                      },
                    ]}
                  >
                    <Icon color={colors.onPrimary} size={16} />
                  </View>
                  <View style={styles.historyCopy}>
                    <Text style={styles.historyTitle}>{item.habit.title}</Text>
                    <Text style={styles.historyMeta}>
                      {normalizeHabitType(item.habit.habitType).replace(
                        '_',
                        '-',
                      )}{' '}
                      • {getHabitScheduleSummary(item.habit)} •{' '}
                      {getHabitTotalSuccesses(item.habit)} successful
                    </Text>
                  </View>
                  {item.habit.archived ? (
                    <Pressable
                      accessibilityLabel={`Resume ${item.habit.title}`}
                      accessibilityRole="button"
                      disabled={Boolean(resumingHabitId)}
                      onPress={event => {
                        event.stopPropagation();
                        resumeHabit(item.habit).catch(() => undefined);
                      }}
                      style={styles.resumeHabitButton}
                    >
                      <RotateCcw color={colors.onPrimary} size={15} />
                      <Text style={styles.resumeHabitText}>
                        {resumingHabitId === item.habit.id
                          ? 'RESUMING…'
                          : 'RESUME'}
                      </Text>
                    </Pressable>
                  ) : (
                    <ChevronRight color={colors.muted} size={20} />
                  )}
                </Pressable>
              );
            })()
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
              {selected ? getHabitTotalSuccesses(selected) : 0}
            </Text>
            <Text style={styles.modalCaption}>TOTAL COMPLETIONS</Text>
            <Text style={styles.modalBody}>
              This {normalizeHabitType(selected?.habitType).toLowerCase()} habit
              is scheduled for {selected?.timeOfDay.toLowerCase()}:{' '}
              {selected ? getHabitScheduleSummary(selected) : ''}. Edit it from
              the Today tab.
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
