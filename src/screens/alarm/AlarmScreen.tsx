import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AlarmClock } from 'lucide-react-native';
import type { Notification } from '@notifee/react-native';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../localization';
import { alarmNative } from '../../services/alarmNative';
import {
  getActiveAlarmHabit,
  performAlarmAction,
} from '../../services/habitAlarmService';
import { ALARM_DISMISS, ALARM_SNOOZE } from '../../utils/habitAlerts';
import type { HabitItem } from '../../types/models';

function AlarmContent({ notification }: { notification?: Notification }) {
  const { colors } = useTheme();
  const { t, locale, isRTL } = useTranslation();
  const [habit, setHabit] = useState<HabitItem>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const acting = useRef(false);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: {
          flexGrow: 1,
          padding: 28,
          justifyContent: 'center',
          gap: 28,
        },
        icon: {
          alignSelf: 'center',
          borderRadius: 64,
          padding: 26,
          backgroundColor: colors.iconSurface,
        },
        time: {
          fontSize: 56,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
        },
        title: {
          fontSize: 30,
          fontWeight: '700',
          color: colors.text,
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        },
        body: {
          fontSize: 18,
          color: colors.textSecondary,
          textAlign: isRTL ? 'right' : 'left',
        },
        button: {
          borderRadius: 28,
          padding: 20,
          alignItems: 'center',
          backgroundColor: colors.primary,
        },
        secondary: { backgroundColor: colors.surfaceSecondary },
        buttonText: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.onPrimary,
        },
      }),
    [colors, isRTL],
  );
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (notification) {
          const active = await getActiveAlarmHabit(notification);
          if (mounted) setHabit(active);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })().catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [notification]);
  const act = useCallback(
    async (action: typeof ALARM_DISMISS | typeof ALARM_SNOOZE) => {
      if (acting.current) return;
      acting.current = true;
      setBusy(true);
      try {
        if (notification) await performAlarmAction(notification, action);
        await alarmNative.closeAlarm(
          notification?.id,
          notification
            ? String(notification.data?.occurrenceTime ?? '')
            : undefined,
        );
      } catch {
        Alert.alert(t('habit_alarm_title'), t('habit_alarm_error'));
      } finally {
        acting.current = false;
        setBusy(false);
      }
    },
    [notification, t],
  );
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      act(ALARM_DISMISS);
      return true;
    });
    return () => listener.remove();
  }, [act]);
  const timestamp = Number(notification?.data?.occurrenceTime);
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.icon}>
          <AlarmClock size={64} color={colors.primary} />
        </View>
        {Number.isFinite(timestamp) && (
          <Text style={styles.time}>
            {new Date(timestamp).toLocaleTimeString(locale, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
        <Text style={styles.title}>
          {habit?.title ??
            t(loading ? 'habit_alarm_loading' : 'habit_alarm_unavailable')}
        </Text>
        <Text style={styles.body}>{t('habit_alarm_title')}</Text>
        {(loading || busy) && <ActivityIndicator color={colors.primary} />}
        {habit && (
          <Pressable
            accessibilityRole="button"
            disabled={busy || loading}
            onPress={() => act(ALARM_SNOOZE)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{t('habit_alarm_snooze')}</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => act(ALARM_DISMISS)}
          style={[styles.button, styles.secondary]}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>
            {t('habit_alarm_dismiss')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

export function AlarmScreen(props: { notification?: Notification }) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AlarmContent {...props} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
