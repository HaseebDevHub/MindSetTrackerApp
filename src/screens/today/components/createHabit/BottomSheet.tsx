import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useTranslation } from '../../../../localization';
import useStyles from '../../TodayScreenStyle';
import { X } from 'lucide-react-native';

export function BottomSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.createSheetBackdrop}>
        <Pressable
          accessibilityLabel={t('habit_close_sheet', { title })}
          style={styles.createSheetDismiss}
          onPress={onClose}
        />
        <View accessibilityViewIsModal style={styles.createSheet}>
          <View style={styles.sheetHandle} />
          <View style={[styles.createSheetHeader, isRTL && styles.rowRTL]}>
            <Text style={[styles.sheetTitle, isRTL && styles.textRTL]}>
              {title}
            </Text>
            <Pressable
              accessibilityLabel={t('habit_close_sheet', { title })}
              onPress={onClose}
            >
              <X color={colors.textSecondary} size={22} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}
