import React from 'react';
import { View } from 'react-native';
import styles from './OnboardingProgressStyle';

export function OnboardingProgress({ step }: { step: number }) {
  return (
    <View accessibilityLabel={`Step ${step} of 4`} style={styles.row}>
      <ProgressSegment active={step >= 1} />
      <ProgressSegment active={step >= 2} />
      <ProgressSegment active={step >= 3} />
      <ProgressSegment active={step >= 4} />
    </View>
  );
}

function ProgressSegment({ active }: { active: boolean }) {
  return <View style={[styles.segment, active && styles.active]} />;
}
