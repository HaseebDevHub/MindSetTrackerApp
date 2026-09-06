import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/common/AppButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { TimeWheelPicker } from '../../components/onboarding/TimeWheelPicker';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../localization';
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
  const next = () => {
    if (save()) navigation.navigate('BedTime');
    else
      Alert.alert(
        t('onboarding_save_error'), t('onboarding_save_error_message'),
      );
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
      <Pressable accessibilityRole="button" onPress={() => {}}>
        <Text style={styles.restore}>{t('onboarding_restore')}</Text>
      </Pressable>
    </ScreenContainer>
  );
}
