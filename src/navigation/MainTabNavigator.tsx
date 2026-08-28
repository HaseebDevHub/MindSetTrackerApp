import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, BookOpen, CalendarDays, User } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import type { MainTabParamList } from '../types/models';
import { HistoryNavigator } from './HistoryNavigator';
import { JourneyNavigator } from './JourneyNavigator';
import { MeNavigator } from './MeNavigator';
import { renderTabIcon, TabLabel } from './TabBarComponents';
import { TodayNavigator } from './TodayNavigator';
import useStyles from './MainTabNavigatorStyle';

const Tabs = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 66 + insets.bottom,
            paddingBottom: 7 + insets.bottom,
          },
        ],
        tabBarItemStyle: styles.tabItem,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabMuted,
        tabBarLabel: TabLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="Today"
        component={TodayNavigator}
        options={{ tabBarIcon: renderTabIcon(CalendarDays) }}
      />
      <Tabs.Screen
        name="Journey"
        component={JourneyNavigator}
        options={{ tabBarIcon: renderTabIcon(BookOpen) }}
      />
      <Tabs.Screen
        name="History"
        component={HistoryNavigator}
        options={{ tabBarIcon: renderTabIcon(BarChart3) }}
      />
      <Tabs.Screen
        name="Me"
        component={MeNavigator}
        options={{ tabBarIcon: renderTabIcon(User) }}
      />
    </Tabs.Navigator>
  );
}
