import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Share,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import {
  Bell,
  CircleUserRound,
  Crown,
  Languages,
  MessageSquare,
  RefreshCw,
  Settings,
  Share2,
  Star,
  type LucideIcon,
} from 'lucide-react-native';
import { SmallVerticalListSeparator } from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SettingRow } from '../../components/common/SettingRow';
import { ToastMessage } from '../../components/common/ToastMessage';
import { useTheme } from '../../context/ThemeContext';
import { useBackupSync } from '../../hooks/useBackupSync';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useTranslation } from '../../localization';
import type { GoogleAuthErrorCode } from '../../services/auth/googleAuthService';
import type { BackupErrorCode } from '../../services/backup/backupTypes';
import { useAppStore } from '../../store/useAppStore';
import type { MeStackParamList } from '../../types/models';
import useStyles from './MeScreenStyle';

type Props = NativeStackScreenProps<MeStackParamList, 'MeHome'>;

export function MeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { isRTL, locale, t } = useTranslation();
  const styles = useStyles();
  const premium = useAppStore(s => s.isPremium);
  const {
    user: googleUser,
    connect: connectGoogle,
    disconnect: disconnectGoogle,
    isAuthenticating,
    isRestoring: isRestoringGoogle,
  } = useGoogleAuth();
  const {
    status: syncStatus,
    isSyncing,
    isRestoring: isRestoringBackup,
    lastSyncedAt,
    error: syncError,
    syncNow,
    restoreLatest,
  } = useBackupSync();
  const [toast, setToast] = useState<
    { message: string; type: 'success' | 'error' | 'info' } | undefined
  >();
  const googleBusy =
    isAuthenticating || isRestoringGoogle || isSyncing || isRestoringBackup;

  const showGoogleAuthError = useCallback(
    (reason: GoogleAuthErrorCode, operation: 'connect' | 'disconnect') => {
      if (reason === 'cancelled' || reason === 'in_progress') return;

      const messageKey =
        reason === 'play_services_unavailable'
          ? 'settings_google_error_play_services'
          : reason === 'network'
          ? 'settings_google_error_network'
          : reason === 'configuration'
          ? 'settings_google_error_configuration'
          : operation === 'disconnect'
          ? 'settings_google_error_disconnect'
          : 'settings_google_error_unexpected';
      Alert.alert(t('settings_google_error_title'), t(messageKey));
    },
    [t],
  );

  const connect = useCallback(async () => {
    const result = await connectGoogle();
    if (!result.ok) showGoogleAuthError(result.reason, 'connect');
  }, [connectGoogle, showGoogleAuthError]);

  const disconnect = useCallback(async () => {
    const result = await disconnectGoogle();
    if (!result.ok) showGoogleAuthError(result.reason, 'disconnect');
  }, [disconnectGoogle, showGoogleAuthError]);

  const showBackupError = useCallback(
    (reason: BackupErrorCode) => {
      const key =
        reason === 'offline'
          ? 'settings_backup_error_offline'
          : reason === 'permission_denied' || reason === 'scope_required'
          ? 'settings_backup_error_permission'
          : reason === 'malformed_backup' || reason === 'incompatible_backup'
          ? 'settings_backup_error_invalid'
          : reason === 'not_found'
          ? 'settings_backup_error_not_found'
          : reason === 'cancelled'
          ? undefined
          : 'settings_backup_error_generic';
      if (key) setToast({ message: t(key), type: 'error' });
    },
    [t],
  );

  const performSync = useCallback(
    async (confirmRemoteOverwrite = false) => {
      const result = await syncNow({ confirmRemoteOverwrite });
      if (result.ok) {
        setToast({ message: t('settings_backup_success'), type: 'success' });
      } else {
        showBackupError(result.reason);
      }
    },
    [showBackupError, syncNow, t],
  );

  const handleSync = useCallback(() => {
    if (googleBusy || !googleUser) return;
    if (
      syncStatus === 'conflict' ||
      syncStatus === 'restore_available' ||
      syncError === 'malformed_backup' ||
      syncError === 'incompatible_backup'
    ) {
      Alert.alert(
        t('settings_backup_overwrite_title'),
        t('settings_backup_overwrite_message'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('settings_sync_data'),
            style: 'destructive',
            onPress: () => performSync(true).catch(() => undefined),
          },
        ],
      );
      return;
    }
    performSync().catch(() => undefined);
  }, [googleBusy, googleUser, performSync, syncError, syncStatus, t]);

  const confirmRestore = useCallback(() => {
    Alert.alert(
      t('settings_restore_title'),
      t('settings_restore_message'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('settings_restore_backup'),
          style: 'destructive',
          onPress: () => {
            restoreLatest()
              .then(result => {
                if (result.ok) {
                  setToast({
                    message: t('settings_restore_success'),
                    type: 'success',
                  });
                } else showBackupError(result.reason);
              })
              .catch(() => undefined);
          },
        },
      ],
    );
  }, [restoreLatest, showBackupError, t]);

  const handleGoogleAccountPress = useCallback(() => {
    if (googleBusy) return;
    if (!googleUser) {
      connect().catch(() => undefined);
      return;
    }

    Alert.alert(t('settings_backup_manage_title'), googleUser.email, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('settings_restore_backup'),
        onPress: confirmRestore,
      },
      {
        text: t('settings_google_disconnect'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            t('settings_google_disconnect_title'),
            t('settings_google_disconnect_message', {
              email: googleUser.email,
            }),
            [
              { text: t('cancel'), style: 'cancel' },
              {
                text: t('settings_google_disconnect'),
                style: 'destructive',
                onPress: () => disconnect().catch(() => undefined),
              },
            ],
          );
        },
      },
    ]);
  }, [connect, confirmRestore, disconnect, googleBusy, googleUser, t]);

  const syncStatusText = useMemo(() => {
    if (syncStatus === 'checking') return t('settings_google_restoring');
    if (isSyncing) return t('settings_backup_syncing');
    if (isRestoringBackup) return t('settings_backup_restoring');
    if (syncStatus === 'pending') return t('settings_backup_pending');
    if (syncStatus === 'offline') return t('settings_backup_offline');
    if (syncStatus === 'conflict') return t('settings_backup_conflict');
    if (syncStatus === 'restore_available') {
      return t('settings_backup_restore_available');
    }
    if (syncStatus === 'error') {
      if (syncError === 'permission_denied' || syncError === 'scope_required') {
        return t('settings_backup_error_permission');
      }
      if (
        syncError === 'malformed_backup' ||
        syncError === 'incompatible_backup' ||
        syncError === 'backup_too_large'
      ) {
        return t('settings_backup_error_invalid');
      }
      return t('settings_backup_error_generic');
    }
    if (lastSyncedAt) {
      return t('settings_backup_last_synced', {
        date: new Date(lastSyncedAt).toLocaleString(locale),
      });
    }
    return t('settings_backup_not_synced');
  }, [
    isRestoringBackup,
    isSyncing,
    lastSyncedAt,
    locale,
    syncError,
    syncStatus,
    t,
  ]);
  const share = useCallback(async () => {
    try {
      await Share.share({
        message: t('settings_share_message'),
      });
    } catch {
      Alert.alert(
        t('settings_sharing_unavailable'),
        t('settings_try_again_later'),
      );
    }
  }, [t]);
  const settingsRows = useMemo<
    { id: string; icon: LucideIcon; title: string; onPress: () => void }[]
  >(
    () => [
      {
        id: 'notifications',
        icon: Bell,
        title: t('settings_notification'),
        onPress: () => navigation.navigate('Notifications'),
      },
      {
        id: 'general',
        icon: Settings,
        title: t('settings_general'),
        onPress: () => navigation.navigate('GeneralSettings'),
      },
      {
        id: 'language',
        icon: Languages,
        title: t('settings_language'),
        onPress: () => navigation.navigate('Language'),
      },
      {
        id: 'share',
        icon: Share2,
        title: t('settings_share'),
        onPress: share,
      },
      {
        id: 'rate',
        icon: Star,
        title: t('settings_rate'),
        onPress: () =>
          Alert.alert(t('settings_thank_you'), t('settings_rating_preview')),
      },
      {
        id: 'feedback',
        icon: MessageSquare,
        title: t('settings_feedback'),
        onPress: () => navigation.navigate('Feedback'),
      },
    ],
    [navigation, share, t],
  );
  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Text style={[styles.pageTitle, isRTL && styles.textRTL]}>
          {t('settings_me')}
        </Text>
      </View>
      <FlashList
        data={settingsRows}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SettingRow
            icon={item.icon}
            title={item.title}
            onPress={item.onPress}
            isRTL={isRTL}
          />
        )}
        ItemSeparatorComponent={SmallVerticalListSeparator}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.page}
        ListHeaderComponent={
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                googleUser
                  ? t('settings_backup_manage_accessibility', {
                      email: googleUser.email,
                    })
                  : t('settings_google_connect_accessibility')
              }
              accessibilityState={{ disabled: googleBusy, busy: googleBusy }}
              disabled={googleBusy}
              onPress={handleGoogleAccountPress}
              style={[styles.backup, isRTL && styles.rowRTL]}
            >
              <View style={styles.backupIcon}>
                {googleUser?.photo ? (
                  <Image
                    accessibilityIgnoresInvertColors
                    source={{ uri: googleUser.photo }}
                    style={styles.backupImage}
                  />
                ) : googleUser ? (
                  <CircleUserRound color={colors.primary} size={27} />
                ) : (
                  <RefreshCw color={colors.primary} size={25} />
                )}
              </View>
              <View style={styles.copy}>
                <Text style={[styles.backupTitle, isRTL && styles.textRTL]}>
                  {t('settings_google_account')}
                </Text>
                {googleUser?.name ? (
                  <Text style={[styles.accountName, isRTL && styles.textRTL]}>
                    {googleUser.name}
                  </Text>
                ) : null}
                <Text
                  numberOfLines={1}
                  style={[styles.subtitle, isRTL && styles.textRTL]}
                >
                  {googleUser
                    ? t('settings_google_connected_as', {
                        email: googleUser.email,
                      })
                    : isRestoringGoogle
                    ? t('settings_google_restoring')
                    : t('settings_google_not_connected')}
                </Text>
                {googleUser ? (
                  <Text
                    numberOfLines={1}
                    style={[styles.backupStatus, isRTL && styles.textRTL]}
                  >
                    {syncStatusText}
                  </Text>
                ) : null}
              </View>
              {googleBusy ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    googleUser
                      ? t('settings_sync_data')
                      : t('settings_google_connect')
                  }
                  onPress={event => {
                    event.stopPropagation();
                    if (googleUser) handleSync();
                    else handleGoogleAccountPress();
                  }}
                  hitSlop={10}
                >
                  <Text style={[styles.backupAction, isRTL && styles.textRTL]}>
                    {googleUser
                      ? t('settings_sync_data')
                      : t('settings_google_connect')}
                  </Text>
                </Pressable>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Premium')}
              style={[styles.premium, isRTL && styles.rowRTL]}
            >
              <Crown color={colors.yellow} size={30} />
              <View style={styles.copy}>
                <Text style={[styles.premiumTitle, isRTL && styles.textRTL]}>
                  {premium
                    ? t('settings_premium_active')
                    : t('settings_go_premium')}
                </Text>
                <Text style={[styles.premiumSubtitle, isRTL && styles.textRTL]}>
                  {premium
                    ? t('settings_premium_active_description')
                    : t('settings_premium_description')}
                </Text>
              </View>
            </Pressable>
            <Text style={[styles.section, isRTL && styles.textRTL]}>
              {t('settings_title')}
            </Text>
          </>
        }
        ListFooterComponent={
          <Text style={[styles.version, isRTL && styles.centeredTextRTL]}>
            {t('settings_version')}
          </Text>
        }
      />
      <ToastMessage
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        type={toast?.type}
        isRTL={isRTL}
        onDismiss={() => setToast(undefined)}
      />
    </ScreenContainer>
  );
}
