import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Apple, Check } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import useStyles from '../OnboardingScreenStyle';

export function GoalCard({
  title,
  Icon,
  selected,
  onPress,
}: {
  title: string;
  Icon: typeof Apple;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const press = () => {
    scale.value = withSequence(
      withTiming(0.96, { duration: 90 }),
      withTiming(1, { duration: 130 }),
    );
    onPress();
  };
  return (
    <Animated.View
      style={[styles.goalCard, selected && styles.goalSelected, animatedStyle]}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        onPress={press}
        style={styles.goalPress}
      >
        <Icon color={selected ? colors.onPrimary : colors.primary} size={29} />
        <Text style={[styles.goalTitle, selected && styles.goalTitleSelected]}>
          {title}
        </Text>
        {selected ? (
          <View style={styles.checkBadge}>
            <Check color={colors.selectedBlue} size={13} strokeWidth={3} />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}
