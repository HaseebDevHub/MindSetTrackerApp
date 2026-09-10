import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useTranslation } from '../../../../localization';
import useStyles from '../../TodayScreenStyle';
import { Check, Minus, Plus } from 'lucide-react-native';
import { AppButton } from '../../../../components/common/AppButton';
import { normalizeWeekdays } from '../../../../utils/habitSchedule';
import { BottomSheet } from './BottomSheet';
import {
  scheduleModes,
  scheduleLabelKeys,
  weekdayLabelKeys,
  weekdayAccessibilityKeys,
  type ScheduleDraft,
} from './createHabitOptions';

export function ScheduleSheet({
  visible,
  value,
  onCancel,
  onSave,
}: {
  visible: boolean;
  value: ScheduleDraft;
  onCancel: () => void;
  onSave: (value: ScheduleDraft) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
  const [draft, setDraft] = useState(value);
  const maximum =
    draft.mode === 'WEEKLY_QUOTA'
      ? 6
      : draft.mode === 'MONTHLY_QUOTA'
      ? 31
      : 365;
  const requiresQuota =
    draft.mode === 'WEEKLY_QUOTA' ||
    draft.mode === 'MONTHLY_QUOTA' ||
    draft.mode === 'YEARLY_QUOTA';
  const valid = draft.mode !== 'SPECIFIC_DAYS' || draft.weekdays.length > 0;

  return (
    <BottomSheet visible={visible} title={t('habit_days')} onClose={onCancel}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.createSheetOptions}>
          {scheduleModes.map(mode => {
            const selected = draft.mode === mode;
            return (
              <Pressable
                key={mode}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setDraft(current => ({ ...current, mode }))}
                style={[
                  styles.createSheetOption,
                  isRTL && styles.rowRTL,
                  selected && styles.createSheetOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.createSheetOptionText,
                    isRTL && styles.textRTL,
                  ]}
                >
                  {t(scheduleLabelKeys[mode])}
                </Text>
                <View
                  style={[
                    styles.createRadio,
                    selected && styles.createRadioActive,
                  ]}
                >
                  {selected ? (
                    <Check color={colors.onPrimary} size={16} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        {draft.mode === 'SPECIFIC_DAYS' ? (
          <View style={[styles.weekdayPicker, isRTL && styles.rowRTL]}>
            {weekdayLabelKeys.map((labelKey, weekday) => {
              const selected = draft.weekdays.includes(weekday);
              return (
                <Pressable
                  key={`${labelKey}-${weekday}`}
                  accessibilityLabel={t(weekdayAccessibilityKeys[weekday])}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() =>
                    setDraft(current => ({
                      ...current,
                      weekdays: current.weekdays.includes(weekday)
                        ? current.weekdays.filter(
                            dayValue => dayValue !== weekday,
                          )
                        : normalizeWeekdays([...current.weekdays, weekday]),
                    }))
                  }
                  style={[
                    styles.weekdayButton,
                    selected && styles.weekdayButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekdayButtonText,
                      isRTL && styles.centeredTextRTL,
                      selected && styles.accentActiveText,
                    ]}
                  >
                    {t(labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {requiresQuota ? (
          <View style={[styles.quotaPicker, isRTL && styles.rowRTL]}>
            <Pressable
              accessibilityLabel={t('habit_decrease_target')}
              disabled={draft.quota <= 1}
              onPress={() =>
                setDraft(current => ({
                  ...current,
                  quota: Math.max(1, current.quota - 1),
                }))
              }
              style={styles.quotaButton}
            >
              <Minus color={colors.text} size={22} />
            </Pressable>
            <View style={styles.quotaValueGroup}>
              <Text style={styles.quotaValue}>{draft.quota}</Text>
              <Text
                style={[styles.quotaCaption, isRTL && styles.centeredTextRTL]}
              >
                {draft.mode === 'WEEKLY_QUOTA'
                  ? t('habit_days_per_week')
                  : draft.mode === 'MONTHLY_QUOTA'
                  ? t('habit_days_per_month')
                  : t('habit_days_per_year')}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={t('habit_increase_target')}
              disabled={draft.quota >= maximum}
              onPress={() =>
                setDraft(current => ({
                  ...current,
                  quota: Math.min(maximum, current.quota + 1),
                }))
              }
              style={styles.quotaButton}
            >
              <Plus color={colors.text} size={22} />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
      {!valid ? (
        <Text style={[styles.formError, isRTL && styles.textRTL]}>
          {t('habit_select_weekday_error')}
        </Text>
      ) : null}
      <View style={[styles.createSheetActions, isRTL && styles.rowRTL]}>
        <AppButton
          title={t('common_cancel')}
          variant="secondary"
          onPress={onCancel}
          style={styles.createSheetAction}
        />
        <AppButton
          title={t('common_save')}
          disabled={!valid}
          onPress={() => onSave(draft)}
          style={styles.createSheetAction}
        />
      </View>
    </BottomSheet>
  );
}
