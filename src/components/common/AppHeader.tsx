import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import styles from './AppHeaderStyle';

export function AppHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={onBack}
          style={styles.side}
        >
          <ArrowLeft color={colors.text} size={24} />
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}
