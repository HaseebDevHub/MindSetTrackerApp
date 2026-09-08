import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import type { RootStackParamList } from '../types/models';
import { MainTabNavigator } from './MainTabNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { SplashScreen } from '../screens/splash/SplashScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const getInitialRootRoute = (onboardingComplete: boolean) =>
  onboardingComplete ? ('Splash' as const) : ('Onboarding' as const);

export function RootNavigator() {
  const { colors } = useTheme();
  const complete = useAppStore(state => state.onboardingComplete);

  return (
    <RootStack.Navigator
      initialRouteName={getInitialRootRoute(complete)}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
      <RootStack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
      <RootStack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
    </RootStack.Navigator>
  );
}
