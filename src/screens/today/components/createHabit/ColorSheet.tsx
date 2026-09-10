import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useTranslation } from '../../../../localization';
import useStyles from '../../TodayScreenStyle';
import { HABIT_COLORS } from '../../../../constants/habitColors';
import { Check } from 'lucide-react-native';
import { colorLabelKeys, backgroundColorStyle } from './createHabitOptions';
import { BottomSheet } from './BottomSheet';
import { AppButton } from '../../../../components/common/AppButton';

export function ColorSheet({
  value,
  onCancel,
  onSave,
}: {
  value: string;
  onCancel: () => void;
  onSave: (value: string) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const [draft, setDraft] = useState(value);
  return (
    <BottomSheet
      visible={true}
      title={t('habit_color_picker_title')}
      onClose={() => onCancel()}
    >
      <View style={[styles.colorPickerGrid, isRTL && styles.wrapRowRTL]}>
        {HABIT_COLORS.map(option => {
          const selected = draft === option.value;
          return (
            <Pressable
              key={option.id}
              accessibilityLabel={t('habit_color_accessibility', {
                label: t(colorLabelKeys[option.id] ?? 'habit_color'),
              })}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setDraft(option.value)}
              style={[
                styles.colorPickerOption,
                backgroundColorStyle(option.value),
                selected && styles.colorPickerOptionActive,
              ]}
            >
              {selected ? <Check color={colors.onPrimary} size={24} /> : null}
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.createSheetActions, isRTL && styles.rowRTL]}>
        <AppButton
          title={t('common_cancel')}
          variant="secondary"
          onPress={() => onCancel()}
          style={styles.createSheetAction}
        />
        <AppButton
          title={t('common_save')}
          onPress={() => {
            onSave(draft);
          }}
          style={styles.createSheetAction}
        />
      </View>
    </BottomSheet>
  );
}
