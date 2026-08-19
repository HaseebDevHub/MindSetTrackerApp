import React, { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import {
  Bell,
  BookOpen,
  Brain,
  Droplets,
  Footprints,
  Moon,
} from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { AppInput } from '../../components/common/AppInput';
import {
  HorizontalListSeparator,
  SmallVerticalListSeparator,
} from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import type { TimeOfDay, TodayStackParamList } from '../../types/models';
import { keyByName, keyByValue } from '../../utils/lists';
import useStyles from './TodayScreenStyle';

type Props = NativeStackScreenProps<TodayStackParamList, 'CreateHabit'>;
const iconOptions = [
  { name: 'Droplets', icon: Droplets },
  { name: 'Footprints', icon: Footprints },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Brain', icon: Brain },
  { name: 'Moon', icon: Moon },
];
const timeOptions: TimeOfDay[] = ['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME'];

export function CreateHabitScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const habits = useAppStore(s => s.habits);
  const add = useAppStore(s => s.addHabit);
  const update = useAppStore(s => s.updateHabit);
  const existing = habits.find(h => h.id === route.params?.habitId);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [iconName, setIcon] = useState(existing?.iconName ?? 'Droplets');
  const [time, setTime] = useState<TimeOfDay>(existing?.timeOfDay ?? 'MORNING');
  const [reminder, setReminder] = useState(existing?.reminderEnabled ?? false);
  const save = () => {
    if (!title.trim()) return;
    const values = {
      title: title.trim(),
      iconName,
      timeOfDay: time,
      reminderEnabled: reminder,
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
        data={iconOptions}
        keyExtractor={keyByName}
        renderItem={({ item: { name, icon: Icon } }) => (
          <Pressable
            accessibilityLabel={`${name} icon`}
            onPress={() => setIcon(name)}
            style={[styles.iconOption, iconName === name && styles.iconActive]}
          >
            <Icon
              color={
                iconName === name ? colors.onPrimary : colors.textSecondary
              }
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
        <View style={styles.reminderIcon}>
          <Bell color={colors.primary} size={21} />
        </View>
        <View style={styles.reminderCopy}>
          <Text style={styles.reminderTitle}>Habit reminder</Text>
          <Text style={styles.reminderHint}>
            Local preference only • 8:00 AM
          </Text>
        </View>
        <Switch
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
    </ScreenContainer>
  );
}
