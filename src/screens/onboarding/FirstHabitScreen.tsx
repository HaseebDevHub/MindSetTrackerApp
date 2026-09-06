import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import {
  BatteryCharging,
  BedDouble,
  Check,
  Dumbbell,
  Utensils,
  Waves,
} from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import { SmallVerticalListSeparator } from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../localization';
import { useAppStore } from '../../store/useAppStore';
import type { OnboardingStackParamList } from '../../types/models';
import { keyByTitle } from '../../utils/lists';
import { OnboardingTitle } from './components/OnboardingTitle';
import useStyles from './OnboardingScreenStyle';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'FirstHabit'>;
const presets = [
  { title: 'Sleep over 8h', icon: BedDouble },
  { title: 'Have a healthy meal', icon: Utensils },
  { title: 'Drink 8 cups of water', icon: Waves },
  { title: 'Workout', icon: Dumbbell },
  { title: 'Walking', icon: BatteryCharging },
];

export function FirstHabitScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles();
  const stored = useAppStore(s => s.firstHabit);
  const setStored = useAppStore(s => s.setFirstHabit);
  const save = useAppStore(s => s.saveFirstHabit);
  const [custom, setCustom] = useState(
    stored && !presets.some(p => p.title === stored) ? stored : '',
  );
  const chooseCustom = () => {
    if (custom.trim()) setStored(custom.trim());
  };
  const candidate = custom.trim() || stored;
  const next = () => {
    if (save(candidate)) navigation.navigate('PlanGenerator');
    else
      Alert.alert(
        t('onboarding_choose_habit'), t('onboarding_choose_habit_message'),
      );
  };
  return (
    <ScreenContainer scroll keyboard>
      <OnboardingTitle
        step={4}
        back={navigation.goBack}
        title={t('onboarding_first_title')} subtitle={t('onboarding_first_subtitle')}
      />
      <FlashList
        data={presets}
        keyExtractor={keyByTitle}
        extraData={stored}
        renderItem={({ item: { title, icon: Icon } }) => {
          const active = stored === title;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setStored(title);
                setCustom('');
              }}
              style={[styles.preset, active && styles.presetActive]}
            >
              <Icon
                color={active ? colors.onPrimary : colors.primary}
                size={21}
              />
              <Text
                style={[
                  styles.presetTitle,
                  active && styles.presetTitleSelected,
                ]}
              >
                {title}
              </Text>
              {active ? <Check color={colors.onPrimary} size={20} /> : null}
            </Pressable>
          );
        }}
        ItemSeparatorComponent={SmallVerticalListSeparator}
        scrollEnabled={false}
        style={styles.presetList}
      />
      <Text style={styles.or}>{t('onboarding_or_custom')}</Text>
      <View style={styles.customRow}>
        <TextInput
          accessibilityLabel={t('onboarding_custom_accessibility')}
          value={custom}
          onChangeText={text => {
            setCustom(text);
            if (!text) setStored(undefined);
          }}
          onSubmitEditing={chooseCustom}
          placeholder={t('onboarding_custom_placeholder')}
          placeholderTextColor={colors.muted}
          style={styles.customInput}
        />
        {custom.trim() ? (
          <Pressable
            accessibilityLabel={t('onboarding_confirm_custom')}
            onPress={chooseCustom}
            style={styles.confirm}
          >
            <Check color={colors.onPrimary} size={20} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.firstActions}>
        <AppButton
          title={t('onboarding_next')}
          disabled={!candidate}
          onPress={next}
          style={styles.flexButton}
        />
      </View>
    </ScreenContainer>
  );
}
