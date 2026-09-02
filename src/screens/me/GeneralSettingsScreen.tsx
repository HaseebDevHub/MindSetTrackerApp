import React, { useState } from 'react';
import { Modal, Pressable, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import {
  CircleHelp,
  Moon,
  Smartphone,
  Sun,
  Volume2,
} from 'lucide-react-native';
import { SettingRow } from '../../components/common/SettingRow';
import type { ThemeMode } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import type { MeStackParamList } from '../../types/models';
import { keyByValue } from '../../utils/lists';
import { SettingsShell } from './components/SettingsShell';
import useStyles from './MeScreenStyle';

type Props = NativeStackScreenProps<MeStackParamList, 'GeneralSettings'>;

export function GeneralSettingsScreen({ navigation }: Props) {
  const { colors, mode, setThemeMode } = useTheme();
  const styles = useStyles();
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [sound, setSound] = useState(true);
  const [haptic, setHaptic] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const weekStartsOn = useAppStore(state => state.weekStartsOn);
  const setWeekStartsOn = useAppStore(state => state.setWeekStartsOn);
  return (
    <SettingsShell title="GENERAL SETTINGS" onBack={navigation.goBack}>
      <Text style={styles.sectionNoMargin}>APPEARANCE</Text>
      <SettingRow
        icon={mode === 'dark' ? Moon : Sun}
        title="Appearance"
        subtitle={mode === 'dark' ? 'Dark' : 'Light'}
        onPress={() => setAppearanceOpen(true)}
      />
      <Text style={styles.section}>WEEK & INTERACTION</Text>
      <FlashList
        data={['Sunday', 'Monday'] as const}
        numColumns={2}
        keyExtractor={keyByValue}
        extraData={weekStartsOn}
        renderItem={({ item: day }) => (
          <View style={styles.choiceCell}>
            <Pressable
              accessibilityLabel={`${day} week start`}
              accessibilityRole="radio"
              accessibilityState={{
                checked: weekStartsOn === (day === 'Sunday' ? 0 : 1),
              }}
              onPress={() => setWeekStartsOn(day === 'Sunday' ? 0 : 1)}
              style={[
                styles.choice,
                weekStartsOn === (day === 'Sunday' ? 0 : 1) &&
                  styles.choiceActive,
              ]}
            >
              <Text
                style={[
                  styles.choiceText,
                  weekStartsOn === (day === 'Sunday' ? 0 : 1) &&
                    styles.choiceTextActive,
                ]}
              >
                {day} start
              </Text>
            </Pressable>
          </View>
        )}
        scrollEnabled={false}
        style={styles.choiceRow}
      />
      <SettingRow
        icon={Volume2}
        title="Sound"
        right={
          <Switch
            value={sound}
            onValueChange={setSound}
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        }
      />
      <SettingRow
        icon={Smartphone}
        title="Haptic feedback"
        right={
          <Switch
            value={haptic}
            onValueChange={setHaptic}
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        }
      />
      <SettingRow
        icon={CircleHelp}
        title="Confirm completion"
        subtitle="Ask before a habit is checked"
        right={
          <Switch
            value={confirm}
            onValueChange={setConfirm}
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        }
      />
      <Modal
        transparent
        visible={appearanceOpen}
        animationType="slide"
        onRequestClose={() => setAppearanceOpen(false)}
      >
        <Pressable
          accessibilityLabel="Close appearance options"
          style={styles.appearanceBackdrop}
          onPress={() => setAppearanceOpen(false)}
        >
          <Pressable
            accessibilityRole="radiogroup"
            style={styles.appearanceSheet}
            onPress={event => event.stopPropagation()}
          >
            <Text style={styles.appearanceTitle}>Appearance</Text>
            {(
              [
                { value: 'dark' as const, label: 'Dark', icon: Moon },
                { value: 'light' as const, label: 'Light', icon: Sun },
              ] satisfies {
                value: ThemeMode;
                label: string;
                icon: typeof Moon;
              }[]
            ).map(option => {
              const selected = mode === option.value;
              const Icon = option.icon;
              return (
                <Pressable
                  key={option.value}
                  accessibilityLabel={`${option.label} theme`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    setThemeMode(option.value);
                    setAppearanceOpen(false);
                  }}
                  style={[
                    styles.appearanceOption,
                    selected && styles.appearanceOptionActive,
                  ]}
                >
                  <Icon color={colors.primary} size={21} />
                  <Text style={styles.appearanceOptionText}>
                    {option.label}
                  </Text>
                  <View
                    style={[
                      styles.appearanceRadio,
                      selected && styles.appearanceRadioActive,
                    ]}
                  >
                    {selected ? (
                      <View style={styles.appearanceRadioDot} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SettingsShell>
  );
}
