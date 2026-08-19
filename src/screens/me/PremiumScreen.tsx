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
import { useAppStore } from '../../store/useAppStore';
import type { MeStackParamList } from '../../types/models';
import { keyByValue } from '../../utils/lists';
import useStyles from './MeScreenStyle';

type Props = NativeStackScreenProps<MeStackParamList, 'Premium'>;
const premiumBenefits = [
  'Unlimited habits and journeys',
  'Deeper progress insights',
  'Premium themes and icons',
  'Support future development',
];

export function PremiumScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const premium = useAppStore(s => s.isPremium);
  const setPremium = useAppStore(s => s.setPremium);
  return (
    <ScreenContainer scroll style={styles.premiumPage}>
      <AppHeader title="PREMIUM" onBack={navigation.goBack} />
      <View style={styles.premiumHero}>
        <View style={styles.crownCircle}>
          <Crown color={colors.yellow} size={52} />
        </View>
        <Text style={styles.premiumHeroTitle}>Make every day count</Text>
        <Text style={styles.premiumHeroText}>
          Explore the full Mindset Tracker experience.
        </Text>
      </View>
      <FlashList
        data={premiumBenefits}
        keyExtractor={keyByValue}
        renderItem={({ item }) => (
          <View style={styles.benefit}>
            <View style={styles.benefitCheck}>
              <Check color={colors.onPrimary} size={15} strokeWidth={3} />
            </View>
            <Text style={styles.benefitText}>{item}</Text>
          </View>
        )}
        ItemSeparatorComponent={VerticalListSeparator}
        scrollEnabled={false}
        style={styles.benefits}
      />
      <View style={styles.priceNotice}>
        <Text style={styles.priceNoticeTitle}>UI preview</Text>
        <Text style={styles.priceNoticeText}>
          No pricing, subscription, or payment is configured. The button below
          only changes local preview state.
        </Text>
      </View>
      <AppButton
        title={premium ? 'PREMIUM IS ACTIVE' : 'PREVIEW PREMIUM'}
        disabled={premium}
        onPress={() => setPremium(true)}
      />
      <Text style={styles.legal}>No purchase will be made.</Text>
    </ScreenContainer>
  );
}
