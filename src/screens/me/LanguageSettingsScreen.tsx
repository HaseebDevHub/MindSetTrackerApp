import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { Check, Globe } from 'lucide-react-native';
import { SmallVerticalListSeparator } from '../../components/common/ListSeparator';
import { useTheme } from '../../context/ThemeContext';
import type { MeStackParamList } from '../../types/models';
import { keyByValue } from '../../utils/lists';
import { SettingsShell } from './components/SettingsShell';
import useStyles from './MeScreenStyle';

type Props = NativeStackScreenProps<MeStackParamList, 'Language'>;
const languages = ['English', 'Urdu', 'Spanish', 'French', 'German'];

export function LanguageSettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [selected, setSelected] = useState('English');
  return (
    <SettingsShell title="LANGUAGE OPTIONS" onBack={navigation.goBack}>
      <Text style={styles.settingsIntro}>
        Choose the language shown in a future localized version of Mindset
        Tracker.
      </Text>
      <FlashList
        data={languages}
        keyExtractor={keyByValue}
        extraData={selected}
        renderItem={({ item: language }) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === language }}
            onPress={() => setSelected(language)}
            style={[
              styles.language,
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
                selected === language && styles.languageTextActive,
              ]}
            >
              {language}
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
