import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { Check, Globe } from 'lucide-react-native';
import { SmallVerticalListSeparator } from '../../components/common/ListSeparator';
import { useTheme } from '../../context/ThemeContext';
import {
  languages,
  setSelectedLanguage,
  useTranslation,
} from '../../localization';
import type { MeStackParamList } from '../../types/models';
import { keyByValue } from '../../utils/lists';
import { SettingsShell } from './components/SettingsShell';
import useStyles from './MeScreenStyle';

type Props = NativeStackScreenProps<MeStackParamList, 'Language'>;
export function LanguageSettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { isRTL, language: selected, t } = useTranslation();
  const languageNames = {
    English: t('language_english'),
    Urdu: t('language_urdu'),
    Spanish: t('language_spanish'),
    French: t('language_french'),
    German: t('language_german'),
  } as const;
  return (
    <SettingsShell title={t('language_title')} onBack={navigation.goBack}>
      <Text style={[styles.settingsIntro, isRTL && styles.textRTL]}>
        {t('language_description')}
      </Text>
      <FlashList
        data={languages}
        keyExtractor={keyByValue}
        extraData={selected}
        renderItem={({ item: language }) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === language }}
            onPress={() => setSelectedLanguage(language)}
            style={[
              styles.language,
              isRTL && styles.rowRTL,
              selected === language && styles.languageActive,
            ]}
          >
            <Globe
              color={
                selected === language ? colors.onPrimary : colors.textSecondary
              }
              size={21}
            />
            <Text
              style={[
                styles.languageText,
                isRTL && styles.textRTL,
                selected === language && styles.languageTextActive,
              ]}
            >
              {languageNames[language]}
            </Text>
            {selected === language ? (
              <View style={styles.languageCheck}>
                <Check color={colors.selectedBlue} size={15} strokeWidth={3} />
              </View>
            ) : null}
          </Pressable>
        )}
        ItemSeparatorComponent={SmallVerticalListSeparator}
        scrollEnabled={false}
        style={styles.languageList}
      />
    </SettingsShell>
  );
}
