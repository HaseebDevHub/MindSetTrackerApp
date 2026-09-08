import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { AppButton } from '../../components/common/AppButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { TimeWheelPicker } from '../../components/onboarding/TimeWheelPicker';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../localization';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useBackupSync } from '../../hooks/useBackupSync';
import { useGoogleAuthStore } from '../../store/useGoogleAuthStore';
import { useBackupSyncStore } from '../../store/useBackupSyncStore';
import { onboardingStorage } from '../../storage/onboardingStorage';
import type { OnboardingStackParamList } from '../../types/models';
import { OnboardingTitle } from './components/OnboardingTitle';
import useStyles from './OnboardingScreenStyle';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'WakeTime'>;

export function WakeTimeScreen({ navigation }: Props) {
  const styles = useStyles();
  const { t } = useTranslation();
  const value = useAppStore(s => s.wakeTime);
  const setValue = useAppStore(s => s.setWakeTime);
  const save = useAppStore(s => s.saveWakeTime);
  const { user, connect } = useGoogleAuth();
  const { initializeForAccount, restoreLatest, isRestoring } = useBackupSync();
  const [isPreparingRestore, setIsPreparingRestore] = useState(false);
  const next = () => {
    if (save()) navigation.navigate('BedTime');
    else
      Alert.alert(
        t('onboarding_save_error'), t('onboarding_save_error_message'),
      );
  };
  const finishRestoreNavigation = () => {
    const step = onboardingStorage.getResumeStep();
    if (step === 'completed') {
      navigation
        .getParent()
        ?.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }),
        );
      return;
    }
    navigation.reset({ index: 0, routes: [{ name: step }] });
  };
  const restore = async () => {
    if (isPreparingRestore || isRestoring) return;
    setIsPreparingRestore(true);
    try {
      let connectedUser = user;
      if (!connectedUser) {
        const result = await connect();
        if (!result.ok) {
          if (result.reason !== 'cancelled') {
            Alert.alert(
              t('settings_google_error_title'),
              t('settings_google_error_unexpected'),
            );
          }
          return;
        }
        connectedUser = useGoogleAuthStore.getState().user;
      }
      if (!connectedUser) return;
      await initializeForAccount(connectedUser.id);
      if (!useBackupSyncStore.getState().backupMetadata) {
        Alert.alert(
          t('settings_backup_error_title'),
          t('settings_backup_error_not_found'),
        );
        return;
      }
      Alert.alert(t('settings_restore_title'), t('settings_restore_message'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('settings_restore_backup'),
          style: 'destructive',
          onPress: () => {
            restoreLatest()
              .then(result => {
                if (result.ok) finishRestoreNavigation();
                else {
                  Alert.alert(
                    t('settings_backup_error_title'),
                    t(
                      result.reason === 'not_found'
                        ? 'settings_backup_error_not_found'
                        : result.reason === 'offline'
                        ? 'settings_backup_error_offline'
                        : 'settings_backup_error_generic',
                    ),
                  );
                }
              })
              .catch(() => undefined);
          },
        },
      ]);
    } finally {
      setIsPreparingRestore(false);
    }
  };
  return (
    <ScreenContainer>
      <OnboardingTitle
        step={1}
        title={t('onboarding_wake_title')} subtitle={t('onboarding_wake_subtitle')}
      />
      <TimeWheelPicker value={value} onChange={setValue} />
      <View style={styles.spacer} />
      <AppButton title={t('onboarding_next')} onPress={next} />
      <Text style={styles.existing}>{t('onboarding_existing')}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={isPreparingRestore || isRestoring}
        onPress={() => restore().catch(() => undefined)}
      >
        <Text style={styles.restore}>
          {isPreparingRestore || isRestoring
            ? t('settings_backup_restoring')
            : t('onboarding_restore')}
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}
