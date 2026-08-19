import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BarChart3, BookOpen, CalendarDays, User } from 'lucide-react-native';
import { colors } from '../constants/theme';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import {
  JourneyDetailScreen,
  JourneyScreen,
} from '../screens/journey/JourneyScreens';
import {
  FeedbackScreen,
  GeneralSettingsScreen,
  LanguageSettingsScreen,
  MeScreen,
  NotificationSettingsScreen,
  PremiumScreen,
} from '../screens/me/MeScreens';
import {
  BedTimeScreen,
  FirstHabitScreen,
  GoalsScreen,
  PlanGeneratorScreen,
  ValuePropositionScreen,
  WakeTimeScreen,
} from '../screens/onboarding/OnboardingScreens';
import {
  CreateHabitScreen,
  HabitDetailScreen,
  TodayScreen,
} from '../screens/today/TodayScreens';
import { useAppStore } from '../store/useAppStore';
import type {
  JourneyStackParamList,
  MeStackParamList,
  OnboardingStackParamList,
  RootStackParamList,
  TodayStackParamList,
} from '../types/models';
import styles from './RootNavigatorStyle';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const TodayStack = createNativeStackNavigator<TodayStackParamList>();
const JourneyStack = createNativeStackNavigator<JourneyStackParamList>();
const MeStack = createNativeStackNavigator<MeStackParamList>();
const Tabs = createBottomTabNavigator();
const stackOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background },
  animation: 'slide_from_right' as const,
};

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={stackOptions}>
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
function TodayNavigator() {
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
function JourneyNavigator() {
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
function HistoryNavigator() {
  return <HistoryScreen />;
}
function MeNavigator() {
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

const tabConfig = {
  Today: { icon: CalendarDays, component: TodayNavigator },
  Journey: { icon: BookOpen, component: JourneyNavigator },
  History: { icon: BarChart3, component: HistoryNavigator },
  Me: { icon: User, component: MeNavigator },
};

const renderTabLabel = ({
  children,
  color,
}: {
  children: string;
  color: string;
}) => (
  <Text style={[styles.tabLabel, { color }]}>
    {String(children).toUpperCase()}
  </Text>
);
const renderTabIcon =
  (Icon: typeof CalendarDays) =>
  ({ color, focused }: { color: string; focused: boolean }) =>
    (
      <Icon
        color={color}
        size={focused ? 24 : 22}
        strokeWidth={focused ? 2.5 : 2}
      />
    );
const tabScreens = Object.entries(tabConfig).map(([name, config]) => ({
  name,
  component: config.component,
  icon: renderTabIcon(config.icon),
}));

function MainTabNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabMuted,
        tabBarLabel: renderTabLabel,
      }}
    >
      {tabScreens.map(config => (
        <Tabs.Screen
          key={config.name}
          name={config.name}
          component={config.component}
          options={{ tabBarIcon: config.icon }}
        />
      ))}
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const complete = useAppStore(s => s.onboardingComplete);
  return (
    <RootStack.Navigator
      initialRouteName={complete ? 'Main' : 'Onboarding'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
      <RootStack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
    </RootStack.Navigator>
  );
}
