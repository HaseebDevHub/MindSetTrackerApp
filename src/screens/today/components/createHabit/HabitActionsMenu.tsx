import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useTranslation } from '../../../../localization';
import useStyles from '../../TodayScreenStyle';
import { Archive, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function HabitActionsMenu({
  onClose,
  onArchive,
  onDelete,
}: {
  onClose: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      transparent
      visible={true}
      animationType="fade"
      onRequestClose={() => onClose()}
    >
      <Pressable
        accessibilityLabel={t('habit_close_actions')}
        style={styles.editActionsBackdrop}
        onPress={() => onClose()}
      >
        <Pressable
          style={[
            styles.editActionsMenu,
            isRTL && styles.editActionsMenuRTL,
            { top: insets.top + 52 },
          ]}
          onPress={event => event.stopPropagation()}
        >
          <Pressable
            accessibilityLabel={t('habit_archive_accessibility')}
            accessibilityRole="button"
            onPress={onArchive}
            style={[styles.editActionItem, isRTL && styles.rowRTL]}
          >
            <Archive color={colors.textSecondary} size={19} />
            <Text style={[styles.editActionText, isRTL && styles.textRTL]}>
              {t('habit_archive_action')}
            </Text>
          </Pressable>
          <View style={styles.editActionDivider} />
          <Pressable
            accessibilityLabel={t('habit_delete_accessibility')}
            accessibilityRole="button"
            onPress={onDelete}
            style={[styles.editActionItem, isRTL && styles.rowRTL]}
          >
            <Trash2 color={colors.red} size={19} />
            <Text
              style={[styles.editActionDangerText, isRTL && styles.textRTL]}
            >
              {t('common_delete')}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
