import React, { useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Bell, Clock, Moon, Zap } from 'lucide-react-native';
import { ReminderTimeModal } from '../../components/common/ReminderTimeModal';
import { SettingRow } from '../../components/common/SettingRow';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../localization';
import { reminderSettingsStorage } from '../../storage/reminderSettingsStorage';
import { notifyPersistentDataChanged } from '../../services/backup/backupSyncEvents';
import type { MeStackParamList } from '../../types/models';
import { formatLocalTime } from '../../utils/time';
import { SettingsShell } from './components/SettingsShell';
import useStyles from './MeScreenStyle';

type Props = NativeStackScreenProps<MeStackParamList, 'Notifications'>;

export function NotificationSettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { isRTL, locale, t } = useTranslation();
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
        t('notification_save_error'),
        t('notification_save_error_message'),
      );
      return;
    }

    setReminderTime(value);
    setTimeEditorVisible(false);
    notifyPersistentDataChanged();
  };
  return (
    <SettingsShell title={t('notification_title')} onBack={navigation.goBack}>
      <View style={[styles.notice, isRTL && styles.rowRTL]}>
        <Bell color={colors.primary} size={21} />
        <Text style={[styles.noticeText, isRTL && styles.textRTL]}>
          {t('notification_preview')}
        </Text>
      </View>
      <SettingRow
        icon={Zap}
        title={t('notification_enable')}
        subtitle={t('notification_enable_description')}
        isRTL={isRTL}
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
        title={t('notification_daily')}
        subtitle={t('notification_daily_description')}
        isRTL={isRTL}
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
        title={t('notification_time')}
        subtitle={formatLocalTime(reminderTime, locale)}
        onPress={() => setTimeEditorVisible(true)}
        showDisclosureIndicator={false}
        isRTL={isRTL}
      />
      <SettingRow
        icon={Bell}
        title={t('notification_habit')}
        subtitle={t('notification_habit_description')}
        isRTL={isRTL}
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
        title={t('notification_select_time')}
        value={reminderTime}
        onCancel={() => setTimeEditorVisible(false)}
        onSave={saveReminderTime}
        isRTL={isRTL}
      />
    </SettingsShell>
  );
}
