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
import { useTranslation } from '../../localization';
import { useAppStore } from '../../store/useAppStore';
import type { MeStackParamList } from '../../types/models';
import { keyByValue } from '../../utils/lists';
import { SettingsShell } from './components/SettingsShell';
import useStyles from './MeScreenStyle';

type Props = NativeStackScreenProps<MeStackParamList, 'GeneralSettings'>;

export function GeneralSettingsScreen({ navigation }: Props) {
  const { colors, mode, setThemeMode } = useTheme();
  const { isRTL, t } = useTranslation();
  const styles = useStyles();
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [sound, setSound] = useState(true);
  const [haptic, setHaptic] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const weekStartsOn = useAppStore(state => state.weekStartsOn);
  const setWeekStartsOn = useAppStore(state => state.setWeekStartsOn);
  return (
    <SettingsShell title={t('general_title')} onBack={navigation.goBack}>
      <Text style={[styles.sectionNoMargin, isRTL && styles.textRTL]}>
        {t('general_appearance_section')}
      </Text>
      <SettingRow
        icon={mode === 'dark' ? Moon : Sun}
        title={t('general_appearance')}
        subtitle={mode === 'dark' ? t('general_dark') : t('general_light')}
        onPress={() => setAppearanceOpen(true)}
        isRTL={isRTL}
      />
      <Text style={[styles.section, isRTL && styles.textRTL]}>
        {t('general_week_section')}
      </Text>
      <FlashList
        data={
          isRTL
            ? (['Monday', 'Sunday'] as const)
            : (['Sunday', 'Monday'] as const)
        }
        numColumns={2}
        keyExtractor={keyByValue}
        extraData={weekStartsOn}
        renderItem={({ item: day }) => (
          <View style={styles.choiceCell}>
            <Pressable
              accessibilityLabel={t('general_week_start_accessibility', {
                day:
                  day === 'Sunday' ? t('general_sunday') : t('general_monday'),
              })}
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
                  isRTL && styles.centeredTextRTL,
                  weekStartsOn === (day === 'Sunday' ? 0 : 1) &&
                    styles.choiceTextActive,
                ]}
              >
                {t('general_week_start', {
                  day:
                    day === 'Sunday'
                      ? t('general_sunday')
                      : t('general_monday'),
                })}
              </Text>
            </Pressable>
          </View>
        )}
        scrollEnabled={false}
        style={styles.choiceRow}
      />
      <SettingRow
        icon={Volume2}
        title={t('general_sound')}
        isRTL={isRTL}
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
        title={t('general_haptic')}
        isRTL={isRTL}
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
        title={t('general_confirm')}
        subtitle={t('general_confirm_description')}
        isRTL={isRTL}
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
          accessibilityLabel={t('general_close_appearance')}
          style={styles.appearanceBackdrop}
          onPress={() => setAppearanceOpen(false)}
        >
          <Pressable
            accessibilityRole="radiogroup"
            style={styles.appearanceSheet}
            onPress={event => event.stopPropagation()}
          >
            <Text style={[styles.appearanceTitle, isRTL && styles.textRTL]}>
              {t('general_appearance')}
            </Text>
            {(
              [
                {
                  value: 'dark' as const,
                  label: t('general_dark'),
                  icon: Moon,
                },
                {
                  value: 'light' as const,
                  label: t('general_light'),
                  icon: Sun,
                },
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
                  accessibilityLabel={t('general_theme_accessibility', {
                    theme: option.label,
                  })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    setThemeMode(option.value);
                    setAppearanceOpen(false);
                  }}
                  style={[
                    styles.appearanceOption,
                    isRTL && styles.rowRTL,
                    selected && styles.appearanceOptionActive,
                  ]}
                >
                  <Icon color={colors.primary} size={21} />
                  <Text
                    style={[
                      styles.appearanceOptionText,
                      isRTL && styles.textRTL,
                    ]}
                  >
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
