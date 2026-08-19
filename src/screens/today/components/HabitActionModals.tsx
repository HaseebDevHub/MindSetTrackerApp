import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { BookOpen, Pencil, Undo2, X } from 'lucide-react-native';
import { AppButton } from '../../../components/common/AppButton';
import { AppInput } from '../../../components/common/AppInput';
import { useTheme } from '../../../context/ThemeContext';
import type { HabitItem } from '../../../types/models';
import useStyles from '../TodayScreenStyle';

type Props = {
  menuHabit?: HabitItem;
  noteHabit?: HabitItem;
  note: string;
  selectedDate: string;
  onCloseMenu: () => void;
  onCloseNote: () => void;
  onEdit: (habit: HabitItem) => void;
  onOpenNote: (habit: HabitItem) => void;
  onSaveNote: (habit: HabitItem, note: string) => void;
  onSetNote: (note: string) => void;
  onUndo: (habit: HabitItem) => void;
};

function MenuItem({
  icon: Icon,
  text,
  onPress,
}: {
  icon: typeof Undo2;
  text: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <Icon color={colors.textSecondary} size={18} />
      <Text style={styles.menuText}>{text}</Text>
    </Pressable>
  );
}

export function HabitActionModals({
  menuHabit,
  noteHabit,
  note,
  selectedDate,
  onCloseMenu,
  onCloseNote,
  onEdit,
  onOpenNote,
  onSaveNote,
  onSetNote,
  onUndo,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <>
      <Modal
        transparent
        visible={Boolean(menuHabit)}
        animationType="fade"
        onRequestClose={onCloseMenu}
      >
        <Pressable style={styles.backdrop} onPress={onCloseMenu}>
          <View style={styles.popover}>
            {menuHabit?.completedDates.includes(selectedDate) ? (
              <MenuItem
                icon={Undo2}
                text="UNDO"
                onPress={() => onUndo(menuHabit)}
              />
            ) : null}
            <MenuItem
              icon={Pencil}
              text="TAKE A NOTE"
              onPress={() => menuHabit && onOpenNote(menuHabit)}
            />
            <MenuItem
              icon={BookOpen}
              text="EDIT"
              onPress={() => menuHabit && onEdit(menuHabit)}
            />
          </View>
        </Pressable>
      </Modal>
      <Modal
        transparent
        visible={Boolean(noteHabit)}
        animationType="slide"
        onRequestClose={onCloseNote}
      >
        <Pressable style={styles.sheetBackdrop} onPress={onCloseNote}>
          <Pressable
            style={styles.sheet}
            onPress={event => event.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTop}>
              <Text style={styles.sheetTitle}>Habit note</Text>
              <Pressable onPress={onCloseNote}>
                <X color={colors.textSecondary} />
              </Pressable>
            </View>
            <AppInput
              multiline
              value={note}
              onChangeText={onSetNote}
              placeholder="How did it go today?"
            />
            <AppButton
              title="SAVE NOTE"
              onPress={() => noteHabit && onSaveNote(noteHabit, note)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
