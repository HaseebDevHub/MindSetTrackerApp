import React, { useLayoutEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { TimeWheelPicker } from '../onboarding/TimeWheelPicker';
import { AppButton } from './AppButton';
import useStyles from './ReminderTimeModalStyle';

type Props = {
  visible: boolean;
  title: string;
  value: string;
  onCancel: () => void;
  onSave: (value: string) => void;
};

export function ReminderTimeModal({
  visible,
  title,
  value,
  onCancel,
  onSave,
}: Props) {
  const styles = useStyles();
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
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          accessibilityViewIsModal
          style={styles.sheet}
          onPress={event => event.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <TimeWheelPicker use12Hour value={draft} onChange={setDraft} />
          <View style={styles.actions}>
            <AppButton
              title="CANCEL"
              variant="secondary"
              onPress={onCancel}
              style={styles.action}
            />
            <AppButton
              title="SAVE"
              onPress={() => onSave(draft)}
              style={styles.action}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
