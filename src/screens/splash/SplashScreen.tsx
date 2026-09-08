import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Check } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../localization';
import { appUsageStorage } from '../../storage/appUsageStorage';
import { useAppStore } from '../../store/useAppStore';
import type { RootStackParamList } from '../../types/models';
import { getSplashMetrics } from '../../utils/splashMetrics';
import useStyles from './SplashScreenStyle';

export const SPLASH_DURATION_MS = 2500;

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
  const styles = useStyles();
  const habits = useAppStore(state => state.habits);
  const weekStartsOn = useAppStore(state => state.weekStartsOn);
  const [startedDateKey] = useState(() => appUsageStorage.ensureStartedDate());
  const metrics = useMemo(
    () => getSplashMetrics(habits, startedDateKey, new Date(), weekStartsOn),
    [habits, startedDateKey, weekStartsOn],
  );
  const targetWidth = Math.max(0, width - 64);
  const progress = useSharedValue(0);
  const navigated = useRef(false);
  const progressStyle = useAnimatedStyle(() => ({ width: progress.value }));

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(targetWidth, { duration: SPLASH_DURATION_MS });
    const timer = setTimeout(() => {
      if (navigated.current) return;
      navigated.current = true;
      navigation.replace('Main');
    }, SPLASH_DURATION_MS);

    return () => {
      clearTimeout(timer);
      cancelAnimation(progress);
    };
  }, [navigation, progress, targetWidth]);

  const weeklyKey =
    metrics.completedThisWeek === 1
      ? 'splash_weekly_completed_one'
      : 'splash_weekly_completed_other';

  return (
    <ScreenContainer padded={false}>
      <View style={styles.page}>
        <Text style={[styles.tagline, isRTL && styles.textRTL]}>
          {t('splash_tagline')}
        </Text>
        <View style={styles.logoArea}>
          <View style={styles.logo} accessibilityLabel={t('splash_logo')}>
            <Check color={colors.text} size={128} strokeWidth={7} />
            <View style={styles.logoDot} />
          </View>
        </View>
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLine} />
            <Text style={[styles.summaryText, isRTL && styles.textRTL]}>
              {t('splash_day_in_app', { day: metrics.appDay })}
            </Text>
            <View style={styles.summaryLine} />
          </View>
          <Text style={[styles.weeklyText, isRTL && styles.textRTL]}>
            {t(weeklyKey, { count: metrics.completedThisWeek })}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      </View>
    </ScreenContainer>
  );
}
