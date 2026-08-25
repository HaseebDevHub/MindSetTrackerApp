import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/common/AppButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { TimeWheelPicker } from '../../components/onboarding/TimeWheelPicker';
import { useAppStore } from '../../store/useAppStore';
import type { OnboardingStackParamList } from '../../types/models';
import { OnboardingTitle } from './components/OnboardingTitle';
import useStyles from './OnboardingScreenStyle';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'WakeTime'>;

export function WakeTimeScreen({ navigation }: Props) {
  const styles = useStyles();
  const value = useAppStore(s => s.wakeTime);
  const setValue = useAppStore(s => s.setWakeTime);
  const save = useAppStore(s => s.saveWakeTime);
  const next = () => {
    if (save()) navigation.navigate('BedTime');
    else
      Alert.alert(
        'Unable to save',
        'Please check the selected time and try again.',
      );
  };
  return (
    <ScreenContainer>
      <OnboardingTitle
        step={1}
        title="What time do you usually get up?"
        subtitle="Choose the time you usually start a new day"
      />
      <TimeWheelPicker value={value} onChange={setValue} />
      <View style={styles.spacer} />
      <AppButton title="NEXT" onPress={next} />
      <Text style={styles.existing}>Already using Mindset Tracker?</Text>
      <Pressable accessibilityRole="button" onPress={() => {}}>
        <Text style={styles.restore}>Restore existing data</Text>
      </Pressable>
    </ScreenContainer>
  );
}
