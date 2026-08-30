import React, { useEffect } from 'react';
import { ActivityIndicator, StatusBar, Text, View } from 'react-native';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppButton } from './src/components/common/AppButton';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { useAppStore } from './src/store/useAppStore';
import styles from './AppStyle';

function ThemedApp() {
  const { colors, mode } = useTheme();
  const isHydrating = useAppStore(state => state.isHydrating);
  const isHydrated = useAppStore(state => state.isHydrated);
  const hydrationError = useAppStore(state => state.hydrationError);
  const initialize = useAppStore(state => state.initialize);
  useEffect(() => {
    initialize().catch(() => undefined);
  }, [initialize]);
  const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    dark: mode === 'dark',
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.divider,
      notification: colors.red,
    },
  };

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      {isHydrated ? (
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      ) : hydrationError ? (
        <View
          style={[styles.bootstrap, { backgroundColor: colors.background }]}
        >
          <Text style={[styles.bootstrapTitle, { color: colors.text }]}>
            Unable to load your habits
          </Text>
          <Text
            style={[styles.bootstrapMessage, { color: colors.textSecondary }]}
          >
            {hydrationError}
          </Text>
          <AppButton
            title="TRY AGAIN"
            loading={isHydrating}
            onPress={() => {
              initialize().catch(() => undefined);
            }}
            style={styles.retryButton}
          />
        </View>
      ) : (
        <View
          style={[styles.bootstrap, { backgroundColor: colors.background }]}
        >
          <ActivityIndicator
            accessibilityLabel="Loading habit data"
            color={colors.primary}
            size="large"
          />
        </View>
      )}
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
