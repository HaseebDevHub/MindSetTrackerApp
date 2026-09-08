import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabScreenProvider } from '../context/TabScreenContext';
import { JourneyDetailScreen } from '../screens/journey/JourneyDetailScreen';
import { ActiveJourneyScreen } from '../screens/journey/ActiveJourneyScreen';
import { JourneyScreen } from '../screens/journey/JourneyScreen';
import type { JourneyStackParamList } from '../types/models';
import { useStackOptions } from './useStackOptions';

const JourneyStack = createNativeStackNavigator<JourneyStackParamList>();

export function JourneyChildScreenLayout({
  children,
}: {
  children: React.ReactElement;
}) {
  return <TabScreenProvider value={false}>{children}</TabScreenProvider>;
}

export function JourneyNavigator() {
  const stackOptions = useStackOptions();

  return (
    <JourneyStack.Navigator screenOptions={stackOptions}>
      <JourneyStack.Screen name="JourneyHome" component={JourneyScreen} />
      <JourneyStack.Screen
        name="JourneyDetail"
        component={JourneyDetailScreen}
        layout={JourneyChildScreenLayout}
      />
      <JourneyStack.Screen
        name="ActiveJourney"
        component={ActiveJourneyScreen}
        layout={JourneyChildScreenLayout}
      />
    </JourneyStack.Navigator>
  );
}
