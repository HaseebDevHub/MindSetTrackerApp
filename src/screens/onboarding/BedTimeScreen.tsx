import React from 'react';
import { Alert, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/common/AppButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { TimeWheelPicker } from '../../components/onboarding/TimeWheelPicker';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../localization';
import type { OnboardingStackParamList } from '../../types/models';
import { OnboardingTitle } from './components/OnboardingTitle';
import useStyles from './OnboardingScreenStyle';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'BedTime'>;

export function BedTimeScreen({ navigation }: Props) {
  const styles = useStyles();
  const { t } = useTranslation();
  const value = useAppStore(s => s.endTime);
  const setValue = useAppStore(s => s.setEndTime);
  const save = useAppStore(s => s.saveEndTime);
  const next = () => {
    if (save()) navigation.navigate('Goals');
    else
      Alert.alert(
        t('onboarding_save_error'), t('onboarding_save_error_message'),
      );
  };
  return (
    <ScreenContainer>
      <OnboardingTitle
        step={2}
        back={navigation.goBack}
        title={t('onboarding_bed_title')} subtitle={t('onboarding_bed_subtitle')}
      />
      <TimeWheelPicker value={value} onChange={setValue} />
      <View style={styles.spacer} />
      <AppButton title={t('onboarding_next')} onPress={next} />
    </ScreenContainer>
  );
}
