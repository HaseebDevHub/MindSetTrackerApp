import React from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import useStyles from './AppInputStyle';

export function AppInput({
  label,
  multiline,
  style,
  isRTL = false,
  ...props
}: TextInputProps & { label?: string; isRTL?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, isRTL && styles.textRTL]}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        multiline={multiline}
        {...props}
        style={[
          styles.input,
          multiline && styles.multiline,
          isRTL && styles.textRTL,
          style,
        ]}
      />
    </View>
  );
}
