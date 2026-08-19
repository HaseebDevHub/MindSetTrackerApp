import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { OnboardingProgress } from '../../../components/onboarding/OnboardingProgress';
import { useTheme } from '../../../context/ThemeContext';
import useStyles from '../OnboardingScreenStyle';

export function OnboardingTitle({
  title,
  subtitle,
  step,
  back,
}: {
  title: string;
  subtitle: string;
  step: number;
  back?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <>
      <View style={styles.top}>
        {back ? (
          <Pressable accessibilityLabel="Go back" hitSlop={12} onPress={back}>
            <ChevronLeft color={colors.text} size={28} />
          </Pressable>
        ) : (
          <View style={styles.backSpace} />
        )}
      </View>
      <OnboardingProgress step={step} />
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </>
  );
}
