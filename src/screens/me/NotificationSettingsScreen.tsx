import React, { useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Bell, Clock, Moon, Zap } from 'lucide-react-native';
import { ReminderTimeModal } from '../../components/common/ReminderTimeModal';
import { SettingRow } from '../../components/common/SettingRow';
import { useTheme } from '../../context/ThemeContext';
import { reminderSettingsStorage } from '../../storage/reminderSettingsStorage';
import type { MeStackParamList } from '../../types/models';
import { formatLocalTime } from '../../utils/time';
import { SettingsShell } from './components/SettingsShell';
import useStyles from './MeScreenStyle';

type Props = NativeStackScreenProps<MeStackParamList, 'Notifications'>;

export function NotificationSettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [enabled, setEnabled] = useState(true);
  const [daily, setDaily] = useState(true);
  const [habits, setHabits] = useState(false);
  const [reminderTime, setReminderTime] = useState(() =>
    reminderSettingsStorage.getNotificationReminderTime(),
  );
  const [timeEditorVisible, setTimeEditorVisible] = useState(false);
  const saveReminderTime = (value: string) => {
    if (!reminderSettingsStorage.setNotificationReminderTime(value)) {
      Alert.alert(
        'Unable to save',
        'Please check the selected time and try again.',
      );
      return;
    }

    setReminderTime(value);
    setTimeEditorVisible(false);
  };
  return (
    <SettingsShell title="NOTIFICATION" onBack={navigation.goBack}>
      <View style={styles.notice}>
        <Bell color={colors.primary} size={21} />
        <Text style={styles.noticeText}>
          These preferences are a UI preview. No notification permissions are
          requested and nothing is scheduled.
        </Text>
      </View>
      <SettingRow
        icon={Zap}
        title="Enable reminders"
        subtitle="Master reminder preference"
        right={
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        }
      />
      <SettingRow
        icon={Moon}
        title="Daily reminder"
        subtitle="Finish your checklist each evening"
        right={
          <Switch
            disabled={!enabled}
            value={enabled && daily}
            onValueChange={setDaily}
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        }
      />
      <SettingRow
        icon={Clock}
        title="Reminder time"
        subtitle={formatLocalTime(reminderTime)}
        onPress={() => setTimeEditorVisible(true)}
        showDisclosureIndicator={false}
      />
      <SettingRow
        icon={Bell}
        title="Habit reminders"
        subtitle="Use preferences set on each habit"
        right={
          <Switch
            disabled={!enabled}
            value={enabled && habits}
            onValueChange={setHabits}
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        }
      />
      <ReminderTimeModal
        visible={timeEditorVisible}
        title="Select reminder time"
        value={reminderTime}
        onCancel={() => setTimeEditorVisible(false)}
        onSave={saveReminderTime}
      />
    </SettingsShell>
  );
}
