import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, BookOpen, CalendarDays, User } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import { JourneyDetailScreen } from '../screens/journey/JourneyDetailScreen';
import { JourneyScreen } from '../screens/journey/JourneyScreen';
import { FeedbackScreen } from '../screens/me/FeedbackScreen';
import { GeneralSettingsScreen } from '../screens/me/GeneralSettingsScreen';
import { LanguageSettingsScreen } from '../screens/me/LanguageSettingsScreen';
import { MeScreen } from '../screens/me/MeScreen';
import { NotificationSettingsScreen } from '../screens/me/NotificationSettingsScreen';
import { PremiumScreen } from '../screens/me/PremiumScreen';
import { BedTimeScreen } from '../screens/onboarding/BedTimeScreen';
import { FirstHabitScreen } from '../screens/onboarding/FirstHabitScreen';
import { GoalsScreen } from '../screens/onboarding/GoalsScreen';
import { PlanGeneratorScreen } from '../screens/onboarding/PlanGeneratorScreen';
import { ValuePropositionScreen } from '../screens/onboarding/ValuePropositionScreen';
import { WakeTimeScreen } from '../screens/onboarding/WakeTimeScreen';
import { CreateHabitScreen } from '../screens/today/CreateHabitScreen';
import { HabitDetailScreen } from '../screens/today/HabitDetailScreen';
import { TodayScreen } from '../screens/today/TodayScreen';
import { onboardingStorage } from '../storage/onboardingStorage';
import { useAppStore } from '../store/useAppStore';
import type {
  JourneyStackParamList,
  MainTabParamList,
  MeStackParamList,
  OnboardingStackParamList,
  RootStackParamList,
  TodayStackParamList,
} from '../types/models';
import useStyles from './RootNavigatorStyle';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const TodayStack = createNativeStackNavigator<TodayStackParamList>();
const JourneyStack = createNativeStackNavigator<JourneyStackParamList>();
const MeStack = createNativeStackNavigator<MeStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();
function useStackOptions() {
  const { colors } = useTheme();
  return useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
      animation: 'slide_from_right' as const,
    }),
    [colors.background],
  );
}

function OnboardingNavigator() {
  const stackOptions = useStackOptions();
  const resumeStep = onboardingStorage.getResumeStep();
  const initialRouteName = resumeStep === 'completed' ? 'WakeTime' : resumeStep;
  return (
    <OnboardingStack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={stackOptions}
    >
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
function JourneyNavigator() {
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
function HistoryNavigator({
  route,
}: BottomTabScreenProps<MainTabParamList, 'History'>) {
  return (
    <HistoryScreen
      initialTab={route.params?.initialTab}
      tabRequestId={route.params?.tabRequestId}
    />
  );
}
function MeNavigator() {
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
function TabLabel({ children, color }: { children: string; color: string }) {
  const styles = useStyles();
  return (
    <Text style={[styles.tabLabel, { color }]}>
      {String(children).toUpperCase()}
    </Text>
  );
}

function MainTabNavigator() {
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

export function RootNavigator() {
  const { colors } = useTheme();
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
