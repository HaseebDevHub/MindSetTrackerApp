import React from 'react';
import { View } from 'react-native';
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
import { keyByTitle } from '../../utils/lists';
import { GoalCard } from './components/GoalCard';
import { OnboardingTitle } from './components/OnboardingTitle';
import useStyles from './OnboardingScreenStyle';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Goals'>;
const goals = [
  { title: 'Live healthier', icon: Apple },
  { title: 'Relieve pressure', icon: Waves },
  { title: 'Try new things', icon: Lightbulb },
  { title: 'Be more focused', icon: Target },
  { title: 'Better relationship', icon: HeartHandshake },
  { title: 'Sleep better', icon: Moon },
];

export function GoalsScreen({ navigation }: Props) {
  const styles = useStyles();
  const selected = useAppStore(s => s.targets);
  const toggle = useAppStore(s => s.toggleTarget);
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
        onPress={() => navigation.navigate('FirstHabit')}
      />
    </ScreenContainer>
  );
}
