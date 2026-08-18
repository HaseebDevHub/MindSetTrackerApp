import React from 'react';
import {View} from 'react-native';
import styles from './OnboardingProgressStyle';

export function OnboardingProgress({step}: {step: number}) {
  return <View accessibilityLabel={`Step ${step} of 4`} style={styles.row}>{[1, 2, 3, 4].map(item => <View key={item} style={[styles.segment, item <= step && styles.active]} />)}</View>;
}
