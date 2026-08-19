import React from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/common/AppButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { TimeWheelPicker } from '../../components/onboarding/TimeWheelPicker';
import { useAppStore } from '../../store/useAppStore';
import type { OnboardingStackParamList } from '../../types/models';
import { OnboardingTitle } from './components/OnboardingTitle';
import useStyles from './OnboardingScreenStyle';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'BedTime'>;

export function BedTimeScreen({ navigation }: Props) {
  const styles = useStyles();
  const value = useAppStore(s => s.endTime);
  const setValue = useAppStore(s => s.setEndTime);
  return (
    <ScreenContainer>
      <OnboardingTitle
        step={2}
        back={navigation.goBack}
        title="What time do you usually end you day?"
        subtitle="We'll remind you to finish your checklist before that"
      />
      <TimeWheelPicker value={value} onChange={setValue} />
      <View style={styles.spacer} />
      <AppButton title="NEXT" onPress={() => navigation.navigate('Goals')} />
    </ScreenContainer>
  );
}
