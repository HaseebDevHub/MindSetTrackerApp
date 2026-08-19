import React from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '../../constants/theme';
import styles from './AppInputStyle';

export function AppInput({
  label,
  multiline,
  ...props
}: TextInputProps & { label?: string }) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline]}
        {...props}
      />
    </View>
  );
}
