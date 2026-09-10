import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AppState,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import notifee from '@notifee/react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from '../../../localization';
import { alarmNative } from '../../../services/alarmNative';
import { isExactAlarmEnabled } from '../../../services/notificationService';
import type { HabitAlertType } from '../../../types/models';

export function HabitAlertTypeSelector({
  value,
  onChange,
}: {
  value: HabitAlertType;
  onChange: (value: HabitAlertType) => void;
}) {
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const themed = useMemo(
    () =>
      StyleSheet.create({
        text: {
          color: colors.text,
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        },
        description: {
          color: colors.textSecondary,
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        },
        row: {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          backgroundColor: colors.surfaceSecondary,
        },
      }),
    [colors, isRTL],
  );
  const [access, setAccess] = useState({ exact: true, fullScreen: true });
  useEffect(() => {
    if (value !== 'alarm' || Platform.OS !== 'android') return;
    let mounted = true;
    const refresh = async () => {
      try {
        const [settings, fullScreen] = await Promise.all([
          notifee.getNotificationSettings(),
          alarmNative.canUseFullScreenIntent(),
        ]);
        if (mounted)
          setAccess({ exact: isExactAlarmEnabled(settings), fullScreen });
      } catch {
        if (mounted) setAccess({ exact: false, fullScreen: false });
      }
    };
    refresh();
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => {
      mounted = false;
      listener.remove();
    };
  }, [value]);
  const openSettings = async () => {
    try {
      if (!access.exact) await notifee.openAlarmPermissionSettings();
      else await alarmNative.openFullScreenSettings();
    } catch {
      Alert.alert(t('habit_alarm_access_title'), t('habit_alarm_error'));
    }
  };
  const fallback =
    value === 'alarm' &&
    Platform.OS === 'android' &&
    (!access.exact || !access.fullScreen);
  return (
    <View style={styles.container}>
      <Text style={[styles.label, themed.text]}>{t('habit_alert_type')}</Text>
      <View style={[styles.row, themed.row]}>
        {(['reminder', 'alarm'] as const).map(type => (
          <Pressable
            key={type}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === type }}
            onPress={() => onChange(type)}
            style={[
              styles.option,
              {
                backgroundColor:
                  value === type ? colors.primary : colors.transparent,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: value === type ? colors.onPrimary : colors.text },
              ]}
            >
              {t(
                type === 'alarm' ? 'habit_alert_alarm' : 'habit_alert_reminder',
              )}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={themed.description}>
        {t(
          value === 'reminder'
            ? 'habit_alert_reminder_description'
            : Platform.OS === 'ios'
            ? 'habit_alert_ios_description'
            : 'habit_alert_alarm_description',
        )}
      </Text>
      {fallback && (
        <>
          <Text accessibilityLiveRegion="polite" style={themed.description}>
            {t(
              !access.exact
                ? 'habit_alarm_exact_message'
                : 'habit_alarm_fullscreen_message',
            )}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={openSettings}
            style={styles.settings}
          >
            <Text style={{ color: colors.primary }}>
              {t('habit_alarm_settings')}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 12, marginTop: 16, marginBottom: 16 },
  row: { borderRadius: 16, padding: 4 },
  option: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  settings: { padding: 12, alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '600' },
});
