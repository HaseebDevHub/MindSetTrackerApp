import React from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useAppStore } from '../../store/useAppStore';
import type { TodayStackParamList } from '../../types/models';
import useStyles from './TodayScreenStyle';

type Props = NativeStackScreenProps<TodayStackParamList, 'HabitDetail'>;

export function HabitDetailScreen({ navigation, route }: Props) {
  const styles = useStyles();
  const habit = useAppStore(s =>
    s.habits.find(item => item.id === route.params.habitId),
  );
  if (!habit) {
    return (
      <ScreenContainer>
        <AppHeader title="HABIT" onBack={navigation.goBack} />
        <Text style={styles.emptyText}>This habit is no longer available.</Text>
      </ScreenContainer>
    );
  }
  return (
    <ScreenContainer>
      <AppHeader title="HABIT DETAILS" onBack={navigation.goBack} />
      <View style={styles.detailHero}>
        <Text style={styles.detailTitle}>{habit.title}</Text>
        <Text style={styles.detailTime}>{habit.timeOfDay}</Text>
        <View style={styles.detailMetric}>
          <Text style={styles.metricNumber}>{habit.completedDates.length}</Text>
          <Text style={styles.metricLabel}>TOTAL COMPLETIONS</Text>
        </View>
      </View>
      {habit.note ? (
        <View style={styles.noteCard}>
          <Text style={styles.label}>LATEST NOTE</Text>
          <Text style={styles.noteText}>{habit.note}</Text>
        </View>
      ) : null}
      <AppButton
        title="EDIT HABIT"
        onPress={() =>
          navigation.navigate('CreateHabit', { habitId: habit.id })
        }
        style={styles.save}
      />
    </ScreenContainer>
  );
}
