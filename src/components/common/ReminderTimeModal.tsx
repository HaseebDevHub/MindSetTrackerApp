import React, { useLayoutEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { TimeWheelPicker } from '../onboarding/TimeWheelPicker';
import { AppButton } from './AppButton';
import useStyles from './ReminderTimeModalStyle';
import { useTranslation } from '../../localization';

type Props = {
  visible: boolean;
  title: string;
  value: string;
  onCancel: () => void;
  onSave: (value: string) => void;
  isRTL?: boolean;
};

export function ReminderTimeModal({
  visible,
  title,
  value,
  onCancel,
  onSave,
  isRTL = false,
}: Props) {
  const styles = useStyles();
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);

  useLayoutEffect(() => {
    if (visible) setDraft(value);
  }, [value, visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel={t('reminder_close_picker')}
          accessibilityRole="button"
          style={styles.backdropDismissArea}
          onPress={onCancel}
        />
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={[styles.title, isRTL && styles.titleRTL]}>{title}</Text>
          {visible && (
            <TimeWheelPicker use12Hour value={draft} onChange={setDraft} />
          )}
          <View style={[styles.actions, isRTL && styles.actionsRTL]}>
            <AppButton
              title={t('common_cancel')}
              variant="secondary"
              onPress={onCancel}
              style={styles.action}
            />
            <AppButton
              title={t('common_save')}
              onPress={() => onSave(draft)}
              style={styles.action}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
