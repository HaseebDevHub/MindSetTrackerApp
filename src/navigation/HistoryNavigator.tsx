import React from 'react';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import type { MainTabParamList } from '../types/models';

/** Adapts History tab route state and date selection to HistoryScreen props. */
export function HistoryNavigator({
  navigation,
  route,
}: BottomTabScreenProps<MainTabParamList, 'History'>) {
  return (
    <HistoryScreen
      initialTab={route.params?.initialTab}
      tabRequestId={route.params?.tabRequestId}
      onDateSelected={() =>
        navigation.navigate('Today', { screen: 'TodayHome' })
      }
    />
  );
}
