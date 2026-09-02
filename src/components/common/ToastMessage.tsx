import React, { useCallback, useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { CheckCircle2, CircleAlert, Info } from 'lucide-react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import useStyles from './ToastMessageStyle';

export type ToastMessageType = 'success' | 'error' | 'info';

type Props = {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  duration?: number;
  type?: ToastMessageType;
};

export function ToastMessage({
  visible,
  message,
  onDismiss,
  duration = 2500,
  type = 'success',
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const onDismissRef = useRef(onDismiss);
  const translateY = useSharedValue(-96);
  const opacity = useSharedValue(0);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const dismissAfterExit = useCallback(() => {
    onDismissRef.current();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    translateY.value = -96;
    opacity.value = 0;
    translateY.value = withSpring(0, {
      damping: 16,
      stiffness: 190,
      mass: 0.8,
    });
    opacity.value = withTiming(1, { duration: 180 });

    const timeout = setTimeout(() => {
      translateY.value = withTiming(-96, {
        duration: 260,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(0, { duration: 220 }, finished => {
        if (finished) runOnJS(dismissAfterExit)();
      });
    }, duration);

    return () => {
      clearTimeout(timeout);
      cancelAnimation(translateY);
      cancelAnimation(opacity);
    };
  }, [dismissAfterExit, duration, message, opacity, translateY, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible || !message) return null;

  const Icon =
    type === 'success'
      ? CheckCircle2
      : type === 'error'
      ? CircleAlert
      : Info;
  const iconColor = colors.onPrimary;

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Animated.View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[styles.toast, styles[type], animatedStyle]}
      >
        <Icon color={iconColor} size={22} />
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
}
