import React from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { Check, Crown } from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { VerticalListSeparator } from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation, type TranslationKey } from '../../localization';
import { useAppStore } from '../../store/useAppStore';
import type { MeStackParamList } from '../../types/models';
import { keyByValue } from '../../utils/lists';
import useStyles from './MeScreenStyle';

type Props = NativeStackScreenProps<MeStackParamList, 'Premium'>;
const premiumBenefits: TranslationKey[] = [
  'premium_benefit_unlimited',
  'premium_benefit_insights',
  'premium_benefit_themes',
  'premium_benefit_support',
];

export function PremiumScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
  const styles = useStyles();
  const premium = useAppStore(s => s.isPremium);
  const setPremium = useAppStore(s => s.setPremium);
  return (
    <ScreenContainer scroll style={styles.premiumPage}>
      <AppHeader
        title={t('premium_title')}
        onBack={navigation.goBack}
        isRTL={isRTL}
      />
      <View style={styles.premiumHero}>
        <View style={styles.crownCircle}>
          <Crown color={colors.yellow} size={52} />
        </View>
        <Text
          style={[styles.premiumHeroTitle, isRTL && styles.centeredTextRTL]}
        >
          {t('premium_hero')}
        </Text>
        <Text style={[styles.premiumHeroText, isRTL && styles.centeredTextRTL]}>
          {t('premium_description')}
        </Text>
      </View>
      <FlashList
        data={premiumBenefits}
        keyExtractor={keyByValue}
        renderItem={({ item }) => (
          <View style={[styles.benefit, isRTL && styles.rowRTL]}>
            <View style={styles.benefitCheck}>
              <Check color={colors.onPrimary} size={15} strokeWidth={3} />
            </View>
            <Text style={[styles.benefitText, isRTL && styles.textRTL]}>
              {t(item)}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={VerticalListSeparator}
        scrollEnabled={false}
        style={styles.benefits}
      />
      <View style={styles.priceNotice}>
        <Text style={[styles.priceNoticeTitle, isRTL && styles.textRTL]}>
          {t('premium_preview_title')}
        </Text>
        <Text style={[styles.priceNoticeText, isRTL && styles.textRTL]}>
          {t('premium_preview_description')}
        </Text>
      </View>
      <AppButton
        title={premium ? t('premium_is_active') : t('premium_preview')}
        disabled={premium}
        onPress={() => setPremium(true)}
      />
      <Text style={[styles.legal, isRTL && styles.centeredTextRTL]}>
        {t('premium_no_purchase')}
      </Text>
    </ScreenContainer>
  );
}
