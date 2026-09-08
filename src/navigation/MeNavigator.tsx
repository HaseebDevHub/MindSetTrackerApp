import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabScreenProvider } from '../context/TabScreenContext';
import { FeedbackScreen } from '../screens/me/FeedbackScreen';
import { GeneralSettingsScreen } from '../screens/me/GeneralSettingsScreen';
import { LanguageSettingsScreen } from '../screens/me/LanguageSettingsScreen';
import { MeScreen } from '../screens/me/MeScreen';
import { NotificationSettingsScreen } from '../screens/me/NotificationSettingsScreen';
import { PremiumScreen } from '../screens/me/PremiumScreen';
import type { MeStackParamList } from '../types/models';
import { useStackOptions } from './useStackOptions';

const MeStack = createNativeStackNavigator<MeStackParamList>();

export function MeChildScreenLayout({
  children,
}: {
  children: React.ReactElement;
}) {
  return <TabScreenProvider value={false}>{children}</TabScreenProvider>;
}

export function MeNavigator() {
  const stackOptions = useStackOptions();

  return (
    <MeStack.Navigator screenOptions={stackOptions}>
      <MeStack.Screen name="MeHome" component={MeScreen} />
      <MeStack.Screen
        name="Premium"
        component={PremiumScreen}
        layout={MeChildScreenLayout}
      />
      <MeStack.Screen
        name="Notifications"
        component={NotificationSettingsScreen}
        layout={MeChildScreenLayout}
      />
      <MeStack.Screen
        name="GeneralSettings"
        component={GeneralSettingsScreen}
        layout={MeChildScreenLayout}
      />
      <MeStack.Screen
        name="Language"
        component={LanguageSettingsScreen}
        layout={MeChildScreenLayout}
      />
      <MeStack.Screen
        name="Feedback"
        component={FeedbackScreen}
        layout={MeChildScreenLayout}
      />
    </MeStack.Navigator>
  );
}
