import React, { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { Bell } from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { AppInput } from '../../components/common/AppInput';
import { ReminderTimeModal } from '../../components/common/ReminderTimeModal';
import {
  HorizontalListSeparator,
  SmallVerticalListSeparator,
} from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { DEFAULT_HABIT_ICON_ID, HABIT_ICONS } from '../../constants/habitIcons';
import { useTheme } from '../../context/ThemeContext';
import { reminderSettingsStorage } from '../../storage/reminderSettingsStorage';
import { useAppStore } from '../../store/useAppStore';
import type { TimeOfDay, TodayStackParamList } from '../../types/models';
import { keyByValue } from '../../utils/lists';
import { formatLocalTime } from '../../utils/time';
import useStyles from './TodayScreenStyle';

type Props = NativeStackScreenProps<TodayStackParamList, 'CreateHabit'>;
const timeOptions: TimeOfDay[] = ['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME'];

export function CreateHabitScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const habits = useAppStore(s => s.habits);
  const add = useAppStore(s => s.addHabit);
  const update = useAppStore(s => s.updateHabit);
  const existing = habits.find(h => h.id === route.params?.habitId);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [iconName, setIcon] = useState(
    existing?.iconName ?? DEFAULT_HABIT_ICON_ID,
  );
  const [time, setTime] = useState<TimeOfDay>(existing?.timeOfDay ?? 'MORNING');
  const [reminder, setReminder] = useState(existing?.reminderEnabled ?? false);
  const [reminderTime, setReminderTime] = useState(
    () => existing?.reminderTime ?? reminderSettingsStorage.getWakeUpDefault(),
  );
  const [timeEditorVisible, setTimeEditorVisible] = useState(false);
  const save = () => {
    if (!title.trim()) return;
    const values = {
      title: title.trim(),
      iconName,
      timeOfDay: time,
      reminderEnabled: reminder,
      reminderTime,
    };
    if (existing) update(existing.id, values);
    else add(values);
    navigation.goBack();
  };
  return (
    <ScreenContainer scroll keyboard style={styles.form}>
      <AppHeader
        title={existing ? 'EDIT HABIT' : 'NEW HABIT'}
        onBack={navigation.goBack}
      />
      <Text style={styles.formIntro}>
        {existing
          ? 'Fine-tune this habit.'
          : 'Create a small action you can repeat.'}
      </Text>
      <AppInput
        label="Habit name"
        autoFocus={!existing}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Read for 10 minutes"
        maxLength={80}
      />
      <Text style={styles.label}>ICON</Text>
      <FlashList
        horizontal
        data={HABIT_ICONS}
        keyExtractor={({ id }) => id}
        renderItem={({ item: { id, label, icon: Icon } }) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel={`${label} icon`}
            accessibilityState={{ selected: iconName === id }}
            onPress={() => setIcon(id)}
            style={[styles.iconOption, iconName === id && styles.iconActive]}
          >
            <Icon
              color={iconName === id ? colors.onPrimary : colors.textSecondary}
              size={23}
            />
          </Pressable>
        )}
        ItemSeparatorComponent={SmallVerticalListSeparator}
        showsHorizontalScrollIndicator={false}
        style={styles.iconOptions}
      />
      <Text style={styles.label}>TIME OF DAY</Text>
      <FlashList
        data={timeOptions}
        numColumns={2}
        keyExtractor={keyByValue}
        renderItem={({ item }) => (
          <View style={styles.timeOptionCell}>
            <Pressable
              onPress={() => setTime(item)}
              style={[styles.timeOption, time === item && styles.timeActive]}
            >
              <Text
                style={[
                  styles.timeText,
                  time === item && styles.accentActiveText,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          </View>
        )}
        ItemSeparatorComponent={HorizontalListSeparator}
        scrollEnabled={false}
        style={styles.timeGrid}
      />
      <View style={styles.reminder}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit habit reminder time, currently ${formatLocalTime(
            reminderTime,
          )}`}
          onPress={() => setTimeEditorVisible(true)}
          style={({ pressed }) => [
            styles.reminderBody,
            pressed && styles.reminderPressed,
          ]}
        >
          <View style={styles.reminderIcon}>
            <Bell color={colors.primary} size={21} />
          </View>
          <View style={styles.reminderCopy}>
            <Text style={styles.reminderTitle}>Habit reminder</Text>
            <Text style={styles.reminderHint}>
              Local preference only • {formatLocalTime(reminderTime)}
            </Text>
          </View>
        </Pressable>
        <Switch
          accessibilityLabel="Enable habit reminder"
          value={reminder}
          onValueChange={setReminder}
          trackColor={{ false: colors.muted, true: colors.primary }}
          thumbColor={colors.onPrimary}
        />
      </View>
      <Text style={styles.mockHint}>
        Reminder scheduling and permissions are not enabled in this UI preview.
      </Text>
      <AppButton
        title={existing ? 'SAVE CHANGES' : 'CREATE HABIT'}
        disabled={!title.trim()}
        onPress={save}
        style={styles.save}
      />
      <ReminderTimeModal
        visible={timeEditorVisible}
        title="Set habit reminder"
        value={reminderTime}
        onCancel={() => setTimeEditorVisible(false)}
        onSave={value => {
          setReminderTime(value);
          setTimeEditorVisible(false);
        }}
      />
    </ScreenContainer>
  );
}
