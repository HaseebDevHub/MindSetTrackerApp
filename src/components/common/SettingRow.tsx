import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import useStyles from './SettingRowStyle';

export function SettingRow({
  icon: Icon,
  title,
  subtitle,
  onPress,
  right,
  showDisclosureIndicator = true,
  isRTL = false,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  showDisclosureIndicator?: boolean;
  isRTL?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        isRTL && styles.rowRTL,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.icon}>
        <Icon color={colors.primary} size={21} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, isRTL && styles.textRTL]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, isRTL && styles.textRTL]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ??
        (onPress && showDisclosureIndicator ? (
          isRTL ? (
            <ChevronLeft color={colors.muted} size={20} />
          ) : (
            <ChevronRight color={colors.muted} size={20} />
          )
        ) : null)}
    </Pressable>
  );
}
