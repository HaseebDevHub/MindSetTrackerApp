import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JourneyDetailScreen } from '../screens/journey/JourneyDetailScreen';
import { JourneyScreen } from '../screens/journey/JourneyScreen';
import type { JourneyStackParamList } from '../types/models';
import { useStackOptions } from './useStackOptions';

const JourneyStack = createNativeStackNavigator<JourneyStackParamList>();

export function JourneyNavigator() {
  const stackOptions = useStackOptions();

  return (
    <JourneyStack.Navigator screenOptions={stackOptions}>
      <JourneyStack.Screen name="JourneyHome" component={JourneyScreen} />
      <JourneyStack.Screen
        name="JourneyDetail"
        component={JourneyDetailScreen}
      />
    </JourneyStack.Navigator>
  );
}
