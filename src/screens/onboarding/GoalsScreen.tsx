import React from 'react';
import { Alert, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import {
  Apple,
  HeartHandshake,
  Lightbulb,
  Moon,
  Target,
  Waves,
} from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import { VerticalListSeparator } from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useAppStore } from '../../store/useAppStore';
import type { OnboardingStackParamList } from '../../types/models';
import { ONBOARDING_TARGETS } from '../../types/onboarding';
import { keyByTitle } from '../../utils/lists';
import { GoalCard } from './components/GoalCard';
import { OnboardingTitle } from './components/OnboardingTitle';
import useStyles from './OnboardingScreenStyle';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Goals'>;
const goals = [
  { title: ONBOARDING_TARGETS[0], icon: Apple },
  { title: ONBOARDING_TARGETS[1], icon: Waves },
  { title: ONBOARDING_TARGETS[2], icon: Lightbulb },
  { title: ONBOARDING_TARGETS[3], icon: Target },
  { title: ONBOARDING_TARGETS[4], icon: HeartHandshake },
  { title: ONBOARDING_TARGETS[5], icon: Moon },
];

export function GoalsScreen({ navigation }: Props) {
  const styles = useStyles();
  const selected = useAppStore(s => s.targets);
  const toggle = useAppStore(s => s.toggleTarget);
  const save = useAppStore(s => s.saveTargets);
  const next = () => {
    if (save()) navigation.navigate('FirstHabit');
    else
      Alert.alert(
        'Choose a target',
        'Select at least one daily target to continue.',
      );
  };
  return (
    <ScreenContainer>
      <OnboardingTitle
        step={3}
        back={navigation.goBack}
        title="What's your target?"
        subtitle="Help us understand your needs better"
      />
      <FlashList
        data={goals}
        numColumns={2}
        keyExtractor={keyByTitle}
        extraData={selected}
        renderItem={({ item: { title, icon } }) => (
          <View style={styles.goalCell}>
            <GoalCard
              title={title}
              Icon={icon}
              selected={selected.includes(title)}
              onPress={() => toggle(title)}
            />
          </View>
        )}
        ItemSeparatorComponent={VerticalListSeparator}
        scrollEnabled={false}
        style={styles.goalGrid}
      />
      <View style={styles.spacer} />
      <AppButton
        title="NEXT"
        disabled={selected.length === 0}
        onPress={next}
      />
    </ScreenContainer>
  );
}
