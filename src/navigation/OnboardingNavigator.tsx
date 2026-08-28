import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BedTimeScreen } from '../screens/onboarding/BedTimeScreen';
import { FirstHabitScreen } from '../screens/onboarding/FirstHabitScreen';
import { GoalsScreen } from '../screens/onboarding/GoalsScreen';
import { PlanGeneratorScreen } from '../screens/onboarding/PlanGeneratorScreen';
import { ValuePropositionScreen } from '../screens/onboarding/ValuePropositionScreen';
import { WakeTimeScreen } from '../screens/onboarding/WakeTimeScreen';
import { onboardingStorage } from '../storage/onboardingStorage';
import type { OnboardingStackParamList } from '../types/models';
import { useStackOptions } from './useStackOptions';

const OnboardingStack =
  createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  const stackOptions = useStackOptions();
  const resumeStep = onboardingStorage.getResumeStep();
  const initialRouteName = resumeStep === 'completed' ? 'WakeTime' : resumeStep;

  return (
    <OnboardingStack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={stackOptions}
    >
      <OnboardingStack.Screen name="WakeTime" component={WakeTimeScreen} />
      <OnboardingStack.Screen name="BedTime" component={BedTimeScreen} />
      <OnboardingStack.Screen name="Goals" component={GoalsScreen} />
      <OnboardingStack.Screen name="FirstHabit" component={FirstHabitScreen} />
      <OnboardingStack.Screen
        name="PlanGenerator"
        component={PlanGeneratorScreen}
        options={{ gestureEnabled: false }}
      />
      <OnboardingStack.Screen
        name="ValueProposition"
        component={ValuePropositionScreen}
        options={{ gestureEnabled: false }}
      />
    </OnboardingStack.Navigator>
  );
}
