import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Check, LockKeyhole } from 'lucide-react-native';
import { getHabitIcon } from '../../../constants/habitIcons';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from '../../../localization';
import type { JourneyTask } from '../../../types/models';
import useStyles from './JourneyTimelineStyle';

export const JourneyTaskRow = React.memo(function JourneyTaskRowView({
  task,
  dateKey,
  completed,
  disabled,
  pending,
  onToggle,
}: {
  task: JourneyTask;
  dateKey: string;
  completed: boolean;
  disabled: boolean;
  pending: boolean;
  onToggle: (taskId: string, dateKey: string) => void;
}) {
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const styles = useStyles();
  const Icon = getHabitIcon(task.iconName);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={t('journey_task_accessibility', {
        title: t(task.titleKey),
        status: t(
          completed ? 'journey_task_completed' : 'journey_task_not_completed',
        ),
      })}
      accessibilityState={{
        checked: completed,
        disabled: disabled || pending,
        busy: pending,
      }}
      disabled={disabled || pending}
      onPress={() => onToggle(task.id, dateKey)}
      style={({ pressed }) => [
        styles.task,
        isRTL && styles.rowRTL,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.icon}>
        <Icon size={22} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, isRTL && styles.textRTL]}>
          {t(task.titleKey)}
        </Text>
        <Text style={[styles.secondary, isRTL && styles.textRTL]}>
          {t(task.subtitleKey)}
        </Text>
      </View>
      <View
        style={[
          styles.check,
          disabled && styles.locked,
          completed && styles.checked,
        ]}
      >
        {pending ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : completed ? (
          <Check size={18} color={colors.onPrimary} />
        ) : disabled ? (
          <LockKeyhole size={14} color={colors.textSecondary} />
        ) : null}
      </View>
    </Pressable>
  );
});
