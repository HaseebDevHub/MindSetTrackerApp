import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CreateHabitScreen } from '../screens/today/CreateHabitScreen';
import { HabitDetailScreen } from '../screens/today/HabitDetailScreen';
import { TodayScreen } from '../screens/today/TodayScreen';
import type { TodayStackParamList } from '../types/models';
import { useStackOptions } from './useStackOptions';

const TodayStack = createNativeStackNavigator<TodayStackParamList>();

export function TodayNavigator() {
  const stackOptions = useStackOptions();

  return (
    <TodayStack.Navigator screenOptions={stackOptions}>
      <TodayStack.Screen name="TodayHome" component={TodayScreen} />
      <TodayStack.Screen
        name="CreateHabit"
        component={CreateHabitScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <TodayStack.Screen name="HabitDetail" component={HabitDetailScreen} />
    </TodayStack.Navigator>
  );
}
