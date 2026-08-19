import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../constants/theme';
import styles from './AppButtonStyle';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={[styles.label, variant === 'ghost' && styles.ghostLabel]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
