import React from 'react';
import { View } from 'react-native';
import useStyles from './OnboardingProgressStyle';
import { useTranslation } from '../../localization';

export function OnboardingProgress({ step }: { step: number }) {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <View accessibilityLabel={t('accessibility_step_progress', { step, total: 4 })} style={styles.row}>
      <ProgressSegment active={step >= 1} />
      <ProgressSegment active={step >= 2} />
      <ProgressSegment active={step >= 3} />
      <ProgressSegment active={step >= 4} />
    </View>
  );
}

function ProgressSegment({ active }: { active: boolean }) {
  const styles = useStyles();
  return <View style={[styles.segment, active && styles.active]} />;
}
