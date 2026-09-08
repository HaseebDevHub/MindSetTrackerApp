import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { OnboardingProgress } from '../../../components/onboarding/OnboardingProgress';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from '../../../localization';
import useStyles from '../OnboardingScreenStyle';

export function OnboardingTitle({
  title,
  subtitle,
  step,
  back,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  step: number;
  back?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <>
      <View style={styles.top}>
        {back ? (
          <Pressable accessibilityLabel={t('common_back')} hitSlop={12} onPress={back}>
            <ChevronLeft color={colors.text} size={28} />
          </Pressable>
        ) : (
          <View style={styles.backSpace} />
        )}
        {actionLabel && onAction ? (
          <Pressable
            accessibilityLabel={actionLabel}
            accessibilityRole="button"
            hitSlop={12}
            onPress={onAction}
          >
            <Text style={styles.topActionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      <OnboardingProgress step={step} />
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </>
  );
}
