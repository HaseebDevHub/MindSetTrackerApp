import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer, DarkTheme} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {RootNavigator} from './src/navigation/RootNavigator';
import {colors} from './src/constants/theme';
import styles from './AppStyle';

const navigationTheme = {...DarkTheme, colors: {...DarkTheme.colors, primary: colors.primary, background: colors.background, card: colors.surface, text: colors.text, border: colors.divider}};

export default function App() {
  return <GestureHandlerRootView style={styles.root}><SafeAreaProvider><StatusBar barStyle="light-content" backgroundColor={colors.background} /><NavigationContainer theme={navigationTheme}><RootNavigator /></NavigationContainer></SafeAreaProvider></GestureHandlerRootView>;
}
