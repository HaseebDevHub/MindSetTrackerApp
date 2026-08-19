import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { BatteryCharging, Check, Sparkles, Target } from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import { VerticalListSeparator } from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import type { OnboardingStackParamList } from '../../types/models';
import useStyles from './OnboardingScreenStyle';

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  'ValueProposition'
>;
const benefits = [
  { icon: Check, text: 'Plan daily routine with a habit list' },
  { icon: Target, text: 'Regulate your life with smart reminders' },
  { icon: Sparkles, text: 'Join scientifically designed journeys' },
  { icon: BatteryCharging, text: 'Keep your streak and consolidate results' },
];

export function ValuePropositionScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { height } = useWindowDimensions();
  const finish = useAppStore(s => s.finishOnboarding);
  return (
    <ScreenContainer scroll style={styles.valueScreen}>
      <View style={[styles.hero, { height: Math.min(310, height * 0.36) }]}>
        <View style={styles.heroGlow} />
        <View style={styles.heroPhone}>
          <View style={styles.heroTick}>
            <Check size={38} color={colors.onPrimary} strokeWidth={3} />
          </View>
          <View style={styles.heroLine} />
          <View style={[styles.heroLine, styles.heroLineShort]} />
        </View>
        <Sparkles style={styles.sparkle} color={colors.yellow} size={38} />
      </View>
      <Text style={[styles.heading, styles.center]}>Meet the better you</Text>
      <Text style={[styles.subtitle, styles.center]}>
        Enjoy your journey of becoming a better you
      </Text>
      <FlashList
        data={benefits}
        keyExtractor={item => item.text}
        renderItem={({ item: { icon: Icon, text } }) => (
          <View style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <Icon color={colors.primary} size={20} />
            </View>
            <Text style={styles.benefitText}>{text}</Text>
          </View>
        )}
        ItemSeparatorComponent={VerticalListSeparator}
        scrollEnabled={false}
        style={styles.benefits}
      />
      <AppButton
        title="START NOW!"
        onPress={() => {
          finish();
          navigation
            .getParent()
            ?.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }),
            );
        }}
      />
    </ScreenContainer>
  );
}
