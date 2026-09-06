import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsInsideTabNavigator } from '../../context/TabScreenContext';
import useStyles from './ScreenContainerStyle';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  keyboard?: boolean;
}

export function ScreenContainer({
  children,
  scroll = false,
  padded = true,
  style,
  keyboard = false,
}: Props) {
  const styles = useStyles();
  const isInsideTabNavigator = useIsInsideTabNavigator();
  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.grow, padded && styles.padded, style]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.grow, padded && styles.padded, style]}>
      {children}
    </View>
  );
  return (
    <SafeAreaView
      edges={
        isInsideTabNavigator
          ? ['top', 'left', 'right']
          : ['top', 'left', 'right', 'bottom']
      }
      style={styles.safe}
    >
      {keyboard ? (
        <KeyboardAvoidingView
          style={styles.grow}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}
