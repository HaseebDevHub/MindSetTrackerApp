import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, BookOpen, CalendarDays, User } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { NotificationCoordinator } from '../components/common/NotificationCoordinator';
import { TabScreenProvider } from '../context/TabScreenContext';
import { useTranslation } from '../localization';
import type { MainTabParamList } from '../types/models';
import { HistoryNavigator } from './HistoryNavigator';
import { JourneyNavigator } from './JourneyNavigator';
import { MeNavigator } from './MeNavigator';
import { renderTabIcon, TabLabel } from './TabBarComponents';
import { TodayNavigator } from './TodayNavigator';
import useStyles from './MainTabNavigatorStyle';

const Tabs = createBottomTabNavigator<MainTabParamList>();

export function shouldShowTodayTabBar(routeName?: string) {
  return !routeName || routeName === 'TodayHome';
}

export function shouldShowJourneyTabBar(routeName?: string) {
  return !routeName || routeName === 'JourneyHome';
}

export function shouldShowMeTabBar(routeName?: string) {
  return !routeName || routeName === 'MeHome';
}

export function MainTabNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const visibleTabBarStyle = [
    styles.tabBar,
    {
      height: 66 + insets.bottom,
      paddingBottom: 7 + insets.bottom,
    },
  ];

  return (
    <TabScreenProvider value>
      <NotificationCoordinator />
      <Tabs.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: visibleTabBarStyle,
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
          options={({ route }) => ({
            tabBarIcon: renderTabIcon(CalendarDays),
            title: t('nav_today'),
            tabBarStyle: shouldShowTodayTabBar(
              getFocusedRouteNameFromRoute(route),
            )
              ? visibleTabBarStyle
              : { display: 'none' },
          })}
        />
        <Tabs.Screen
          name="Journey"
          component={JourneyNavigator}
          options={({ route }) => ({
            tabBarIcon: renderTabIcon(BookOpen),
            title: t('nav_journey'),
            tabBarStyle: shouldShowJourneyTabBar(
              getFocusedRouteNameFromRoute(route),
            )
              ? visibleTabBarStyle
              : { display: 'none' },
          })}
        />
        <Tabs.Screen
          name="History"
          component={HistoryNavigator}
          options={{
            tabBarIcon: renderTabIcon(BarChart3),
            title: t('nav_history'),
          }}
        />
        <Tabs.Screen
          name="Me"
          component={MeNavigator}
          options={({ route }) => ({
            tabBarIcon: renderTabIcon(User),
            title: t('nav_me'),
            tabBarStyle: shouldShowMeTabBar(getFocusedRouteNameFromRoute(route))
              ? visibleTabBarStyle
              : { display: 'none' },
          })}
        />
      </Tabs.Navigator>
    </TabScreenProvider>
  );
}
