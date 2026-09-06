import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../localization';
import useStyles from './AppHeaderStyle';

export function AppHeader({
  title,
  onBack,
  right,
  isRTL = false,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  isRTL?: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <View style={[styles.row, isRTL && styles.rowRTL]}>
      {onBack ? (
        <Pressable
          accessibilityLabel={t('common_back')}
          hitSlop={10}
          onPress={onBack}
          style={styles.side}
        >
          {isRTL ? (
            <ArrowRight color={colors.text} size={24} />
          ) : (
            <ArrowLeft color={colors.text} size={24} />
          )}
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
      <Text numberOfLines={1} style={[styles.title, isRTL && styles.titleRTL]}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}
