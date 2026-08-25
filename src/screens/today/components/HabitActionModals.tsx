import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Pencil, Undo2, X } from 'lucide-react-native';
import { AppButton } from '../../../components/common/AppButton';
import { AppInput } from '../../../components/common/AppInput';
import type { HabitMenuAnchor } from '../../../components/habit/HabitCard';
import { spacing } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import type { HabitItem } from '../../../types/models';
import useStyles from '../TodayScreenStyle';

type Props = {
  menuHabit?: HabitItem;
  menuAnchor?: HabitMenuAnchor;
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

const MENU_WIDTH = 190;
const MENU_ITEM_HEIGHT = 48;
const MENU_ANCHOR_GAP = spacing.small;

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
  menuAnchor,
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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const menuItemCount = menuHabit?.completedDates.includes(selectedDate)
    ? 3
    : 2;
  const estimatedMenuHeight =
    spacing.small * 2 + MENU_ITEM_HEIGHT * menuItemCount;
  const [measuredMenuSize, setMeasuredMenuSize] = useState({
    width: MENU_WIDTH,
    height: estimatedMenuHeight,
    itemCount: menuItemCount,
  });
  const menuWidth = measuredMenuSize.width || MENU_WIDTH;
  const menuHeight =
    measuredMenuSize.itemCount === menuItemCount
      ? measuredMenuSize.height || estimatedMenuHeight
      : estimatedMenuHeight;
  const minLeft = Math.max(spacing.small, insets.left + spacing.small);
  const maxLeft = Math.max(
    minLeft,
    windowWidth - insets.right - spacing.small - menuWidth,
  );
  const minTop = Math.max(spacing.small, insets.top + spacing.small);
  const maxBottom = windowHeight - insets.bottom - spacing.small;
  const maxTop = Math.max(minTop, maxBottom - menuHeight);

  let menuLeft = minLeft;
  let menuTop = minTop;
  if (menuAnchor) {
    menuLeft = Math.min(
      Math.max(menuAnchor.x + menuAnchor.width - menuWidth, minLeft),
      maxLeft,
    );

    const topAbove = menuAnchor.y - MENU_ANCHOR_GAP - menuHeight;
    const topBelow = menuAnchor.y + menuAnchor.height + MENU_ANCHOR_GAP;
    const fitsAbove = topAbove >= minTop;
    const fitsBelow = topBelow + menuHeight <= maxBottom;

    if (fitsAbove) {
      menuTop = topAbove;
    } else if (fitsBelow) {
      menuTop = topBelow;
    } else {
      const spaceAbove = menuAnchor.y - MENU_ANCHOR_GAP - minTop;
      const spaceBelow = maxBottom - topBelow;
      menuTop = spaceAbove >= spaceBelow ? minTop : maxTop;
    }
  }

  return (
    <>
      <Modal
        transparent
        visible={Boolean(menuHabit && menuAnchor)}
        animationType="fade"
        onRequestClose={onCloseMenu}
      >
        <Pressable style={styles.backdrop} onPress={onCloseMenu}>
          <View
            onLayout={({ nativeEvent: { layout } }) => {
              if (
                layout.width !== measuredMenuSize.width ||
                layout.height !== measuredMenuSize.height ||
                menuItemCount !== measuredMenuSize.itemCount
              ) {
                setMeasuredMenuSize({
                  width: layout.width,
                  height: layout.height,
                  itemCount: menuItemCount,
                });
              }
            }}
            style={[styles.popover, { left: menuLeft, top: menuTop }]}
          >
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
