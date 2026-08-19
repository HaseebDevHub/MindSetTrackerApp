import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useTheme } from '../../context/ThemeContext';
import type { OnboardingStackParamList } from '../../types/models';
import useStyles from './OnboardingScreenStyle';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PlanGenerator'>;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const progressSteps = [
  { at: 0, value: 0, text: '' },
  { at: 450, value: 20, text: 'Analyzing your time schedule...' },
  { at: 1350, value: 60, text: 'Selecting habits for your target...' },
  { at: 2250, value: 71, text: 'Preparing your first habit...' },
  { at: 3200, value: 100, text: 'Finished!' },
];

export function PlanGeneratorScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Getting things ready...');
  const animated = useSharedValue(0);
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const circleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value / 100),
  }));
  useEffect(() => {
    animated.value = withTiming(100, {
      duration: 3200,
      easing: Easing.inOut(Easing.cubic),
    });
    const timers: ReturnType<typeof setTimeout>[] = [];
    progressSteps.forEach(step => {
      timers.push(
        setTimeout(() => {
          setProgress(step.value);
          if (step.text) setMessage(step.text);
        }, step.at),
      );
    });
    timers.push(setTimeout(() => navigation.replace('ValueProposition'), 3800));
    return () => timers.forEach(clearTimeout);
  }, [animated, navigation]);
  return (
    <ScreenContainer style={styles.generator}>
      <Text style={styles.heading}>
        {progress === 100
          ? 'Everything is done!'
          : 'Generating your habit plan...'}
      </Text>
      <View style={styles.progressWrap}>
        <Svg width={200} height={200} viewBox="0 0 200 200">
          <Circle
            cx="100"
            cy="100"
            r={radius}
            stroke={colors.surfaceSecondary}
            strokeWidth="12"
            fill="none"
          />
          <AnimatedCircle
            animatedProps={circleProps}
            cx="100"
            cy="100"
            r={radius}
            stroke={colors.primary}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            rotation="-90"
            origin="100, 100"
          />
        </Svg>
        <Text style={styles.percent}>{progress}%</Text>
      </View>
      <Animated.Text
        key={message}
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(150)}
        style={styles.generatorMessage}
      >
        {message}
      </Animated.Text>
    </ScreenContainer>
  );
}
