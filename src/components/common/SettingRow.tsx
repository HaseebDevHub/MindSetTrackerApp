import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {ChevronRight, type LucideIcon} from 'lucide-react-native';
import {colors} from '../../constants/theme';
import styles from './SettingRowStyle';

export function SettingRow({icon: Icon, title, subtitle, onPress, right}: {icon: LucideIcon; title: string; subtitle?: string; onPress?: () => void; right?: React.ReactNode}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({pressed}) => [styles.row, pressed && styles.pressed]}>
    <View style={styles.icon}><Icon color={colors.primary} size={21} /></View><View style={styles.copy}><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>{right ?? (onPress ? <ChevronRight color={colors.muted} size={20} /> : null)}
  </Pressable>;
}
