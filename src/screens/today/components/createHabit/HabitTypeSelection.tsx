import React, { memo, useCallback, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useTranslation } from '../../../../localization';
import useStyles from '../../TodayScreenStyle';
import { AppHeader } from '../../../../components/common/AppHeader';
import { AppButton } from '../../../../components/common/AppButton';
import { ScreenContainer } from '../../../../components/common/ScreenContainer';
import type { HabitType } from '../../../../types/models';
import { habitTypes } from './createHabitOptions';

// Keep selection local: switching tabs should not rerender/reset the entire
// habit form or subscribe to database changes.
export const HabitTypeSelection = memo(function TypeSelection({
  initialType,
  loading = false,
  onBack,
  onContinue,
}: {
  initialType: HabitType;
  loading?: boolean;
  onBack: () => void;
  onContinue: (type: HabitType) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const [selectedType, setSelectedType] = useState(initialType);
  const selectedRef = useRef(initialType);
  const selectType = useCallback((next: HabitType) => {
    if (selectedRef.current === next) return;
    selectedRef.current = next;
    setSelectedType(next);
  }, []);
  const definition = habitTypes.find(item => item.value === selectedType)!;

  return (
    <ScreenContainer scroll style={styles.createTypeScreen}>
      <AppHeader
        title={t('habit_create_title')}
        onBack={onBack}
        isRTL={isRTL}
      />
      <View style={[styles.habitTypeRow, isRTL && styles.rowRTL]}>
        {habitTypes.map(({ value, labelKey, icon: Icon }) => {
          const selected = value === selectedType;
          return (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected, disabled: loading }}
              disabled={loading}
              accessibilityLabel={t(labelKey).replace('\n', ' ')}
              hitSlop={4}
              onPress={() => selectType(value)}
              style={({ pressed }) => [
                styles.habitTypeCard,
                selected && styles.habitTypeCardActive,
                selected && value === 'NEGATIVE' && styles.habitTypeNegative,
                pressed && styles.reminderPressed,
              ]}
            >
              <Icon
                pointerEvents="none"
                color={selected ? colors.onPrimary : colors.textSecondary}
                size={31}
              />
              <Text
                pointerEvents="none"
                style={[
                  styles.habitTypeLabel,
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
      <View style={styles.habitTypeDescription}>
        <Text
          style={[styles.habitTypeDescriptionTitle, isRTL && styles.textRTL]}
        >
          {t(definition.labelKey).replace('\n', ' ')}
        </Text>
        <Text
          style={[styles.habitTypeDescriptionText, isRTL && styles.textRTL]}
        >
          {t(definition.descriptionKey)}
        </Text>
      </View>
      <AppButton
        title={t('habit_create_own')}
        loading={loading}
        onPress={() => onContinue(selectedRef.current)}
        style={styles.createOwnButton}
      />
    </ScreenContainer>
  );
});
