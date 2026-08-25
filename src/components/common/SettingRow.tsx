import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import useStyles from './SettingRowStyle';

export function SettingRow({
  icon: Icon,
  title,
  subtitle,
  onPress,
  right,
  showDisclosureIndicator = true,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  showDisclosureIndicator?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Icon color={colors.primary} size={21} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ??
        (onPress && showDisclosureIndicator ? (
          <ChevronRight color={colors.muted} size={20} />
        ) : null)}
    </Pressable>
  );
}
