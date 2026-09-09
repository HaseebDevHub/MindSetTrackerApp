import React, { useMemo, useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Clock,
  Moon,
  Zap,
} from 'lucide-react-native';
import { ReminderTimeModal } from '../../components/common/ReminderTimeModal';
import { SettingRow } from '../../components/common/SettingRow';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../localization';
import { useNotificationStore } from '../../store/useNotificationStore';
import type { MeStackParamList } from '../../types/models';
import {
  GLOBAL_REMINDER_SLOTS,
  type GlobalReminderSlot,
} from '../../types/notification';
import { formatLocalTime } from '../../utils/time';
import { SettingsShell } from './components/SettingsShell';
import useStyles from './MeScreenStyle';

type Props = NativeStackScreenProps<MeStackParamList, 'Notifications'>;

export function NotificationSettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { isRTL, locale, t } = useTranslation();
  const styles = useStyles();
  const settings = useNotificationStore(state => state.settings);
  const permissionStatus = useNotificationStore(
    state => state.permissionStatus,
  );
  const exactAlarmEnabled = useNotificationStore(
    state => state.exactAlarmEnabled,
  );
  const scheduledCount = useNotificationStore(state => state.scheduledCount);
  const syncStatus = useNotificationStore(state => state.status);
  const setMasterEnabled = useNotificationStore(
    state => state.setMasterEnabled,
  );
  const setGlobalRemindersEnabled = useNotificationStore(
    state => state.setGlobalRemindersEnabled,
  );
  const setHabitRemindersEnabled = useNotificationStore(
    state => state.setHabitRemindersEnabled,
  );
  const setGlobalReminderTime = useNotificationStore(
    state => state.setGlobalReminderTime,
  );
  const openNotificationSettings = useNotificationStore(
    state => state.openNotificationSettings,
  );
  const openAlarmPermissionSettings = useNotificationStore(
    state => state.openAlarmPermissionSettings,
  );
  const [timesExpanded, setTimesExpanded] = useState(false);
  const [activeTimeSlot, setActiveTimeSlot] = useState<GlobalReminderSlot>();

  const statusMessage = useMemo(() => {
    if (syncStatus === 'error') return t('notification_status_error');
    if (permissionStatus === 'denied') return t('notification_status_denied');
    return t('notification_status_active', { count: scheduledCount });
  }, [permissionStatus, scheduledCount, syncStatus, t]);

  const updateSetting = async (operation: Promise<boolean>) => {
    if (!(await operation)) {
      Alert.alert(
        t('notification_save_error'),
        t('notification_save_error_message'),
      );
    }
  };

  const saveReminderTime = async (value: string) => {
    if (!activeTimeSlot) return;
    const saved = await setGlobalReminderTime(activeTimeSlot, value);
    if (!saved) {
      Alert.alert(
        t('notification_save_error'),
        t('notification_save_error_message'),
      );
      return;
    }
    setActiveTimeSlot(undefined);
  };

  const slotLabels: Record<GlobalReminderSlot, string> = {
    morning: t('notification_morning'),
    afternoon: t('notification_afternoon'),
    evening: t('notification_evening'),
  };

  return (
    <SettingsShell title={t('notification_title')} onBack={navigation.goBack}>
      <View style={[styles.notice, isRTL && styles.rowRTL]}>
        <Bell color={colors.primary} size={21} />
        <Text style={[styles.noticeText, isRTL && styles.textRTL]}>
          {statusMessage}
        </Text>
      </View>
      {permissionStatus === 'denied' ? (
        <Pressable
          accessibilityLabel={t('notification_open_settings')}
          accessibilityRole="button"
          onPress={() => openNotificationSettings().catch(() => undefined)}
          style={styles.notificationSettingsAction}
        >
          <Text style={styles.notificationSettingsActionText}>
            {t('notification_open_settings')}
          </Text>
        </Pressable>
      ) : null}
      {!exactAlarmEnabled ? (
        <View style={styles.notificationFallbackCard}>
          <Text style={[styles.noticeText, isRTL && styles.textRTL]}>
            {t('notification_status_exact_fallback')}
          </Text>
          <Pressable
            accessibilityLabel={t('notification_open_alarm_settings')}
            accessibilityRole="button"
            onPress={() => openAlarmPermissionSettings().catch(() => undefined)}
            style={styles.notificationSettingsAction}
          >
            <Text style={styles.notificationSettingsActionText}>
              {t('notification_open_alarm_settings')}
            </Text>
          </Pressable>
        </View>
      ) : null}
      <SettingRow
        icon={Zap}
        title={t('notification_enable')}
        subtitle={t('notification_enable_description')}
        isRTL={isRTL}
        right={
          <Switch
            value={settings.masterEnabled}
            onValueChange={value =>
              updateSetting(setMasterEnabled(value)).catch(() => undefined)
            }
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
            disabled={!settings.masterEnabled}
            value={settings.masterEnabled && settings.globalRemindersEnabled}
            onValueChange={value =>
              updateSetting(setGlobalRemindersEnabled(value)).catch(
                () => undefined,
              )
            }
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        }
      />
      <SettingRow
        icon={Clock}
        title={t('notification_time')}
        subtitle={t('notification_times_description')}
        onPress={() => setTimesExpanded(value => !value)}
        showDisclosureIndicator={false}
        isRTL={isRTL}
        right={
          timesExpanded ? (
            <ChevronUp color={colors.muted} size={20} />
          ) : (
            <ChevronDown color={colors.muted} size={20} />
          )
        }
      />
      {timesExpanded ? (
        <View style={styles.notificationTimeRows}>
          {GLOBAL_REMINDER_SLOTS.map(slot => (
            <SettingRow
              key={slot}
              icon={Clock}
              title={slotLabels[slot]}
              subtitle={formatLocalTime(settings.times[slot], locale)}
              onPress={() => setActiveTimeSlot(slot)}
              isRTL={isRTL}
            />
          ))}
        </View>
      ) : null}
      <SettingRow
        icon={Bell}
        title={t('notification_habit')}
        subtitle={t('notification_habit_description')}
        isRTL={isRTL}
        right={
          <Switch
            disabled={!settings.masterEnabled}
            value={settings.masterEnabled && settings.habitRemindersEnabled}
            onValueChange={value =>
              updateSetting(setHabitRemindersEnabled(value)).catch(
                () => undefined,
              )
            }
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        }
      />
      <ReminderTimeModal
        visible={Boolean(activeTimeSlot)}
        title={t('notification_select_time')}
        value={activeTimeSlot ? settings.times[activeTimeSlot] : '08:00'}
        onCancel={() => setActiveTimeSlot(undefined)}
        onSave={value => saveReminderTime(value).catch(() => undefined)}
        isRTL={isRTL}
      />
    </SettingsShell>
  );
}
