import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useTranslation } from '../../../../localization';
import useStyles from '../../TodayScreenStyle';
import { HABIT_ICONS } from '../../../../constants/habitIcons';
import { iconLabelKeys } from './createHabitOptions';
import { BottomSheet } from './BottomSheet';
import { AppButton } from '../../../../components/common/AppButton';

export function IconSheet({
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
      title={t('habit_icon_picker_title')}
      onClose={() => onCancel()}
    >
      <View style={[styles.iconPickerGrid, isRTL && styles.wrapRowRTL]}>
        {HABIT_ICONS.map(({ id, icon: Icon }) => {
          const selected = draft === id;
          return (
            <Pressable
              key={id}
              accessibilityLabel={t('habit_icon_accessibility', {
                label: t(iconLabelKeys[id] ?? 'habit_icon'),
              })}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setDraft(id)}
              style={[
                styles.iconPickerOption,
                selected && styles.iconPickerOptionActive,
              ]}
            >
              <Icon
                color={selected ? colors.onPrimary : colors.textSecondary}
                size={25}
              />
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
