import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedbackScreen } from '../screens/me/FeedbackScreen';
import { GeneralSettingsScreen } from '../screens/me/GeneralSettingsScreen';
import { LanguageSettingsScreen } from '../screens/me/LanguageSettingsScreen';
import { MeScreen } from '../screens/me/MeScreen';
import { NotificationSettingsScreen } from '../screens/me/NotificationSettingsScreen';
import { PremiumScreen } from '../screens/me/PremiumScreen';
import type { MeStackParamList } from '../types/models';
import { useStackOptions } from './useStackOptions';

const MeStack = createNativeStackNavigator<MeStackParamList>();

export function MeNavigator() {
  const stackOptions = useStackOptions();

  return (
    <MeStack.Navigator screenOptions={stackOptions}>
      <MeStack.Screen name="MeHome" component={MeScreen} />
      <MeStack.Screen name="Premium" component={PremiumScreen} />
      <MeStack.Screen
        name="Notifications"
        component={NotificationSettingsScreen}
      />
      <MeStack.Screen
        name="GeneralSettings"
        component={GeneralSettingsScreen}
      />
      <MeStack.Screen name="Language" component={LanguageSettingsScreen} />
      <MeStack.Screen name="Feedback" component={FeedbackScreen} />
    </MeStack.Navigator>
  );
}
