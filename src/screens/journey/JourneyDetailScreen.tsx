import React from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { Check, Sparkles } from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { SmallVerticalListSeparator } from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useTheme } from '../../context/ThemeContext';
import { journeys } from '../../data/mockData';
import type { JourneyStackParamList } from '../../types/models';
import { keyByValue } from '../../utils/lists';
import { JourneyArtwork } from './components/JourneyArtwork';
import useStyles from './JourneyScreenStyle';

type Props = NativeStackScreenProps<JourneyStackParamList, 'JourneyDetail'>;

export function JourneyDetailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const journey =
    journeys.find(item => item.id === route.params.journeyId) ?? journeys[0];
  return (
    <ScreenContainer style={styles.detailPage}>
      <FlashList
        data={journey.habits}
        keyExtractor={keyByValue}
        ItemSeparatorComponent={SmallVerticalListSeparator}
        renderItem={({ item: habit, index }) => (
          <View style={styles.habit}>
            <View style={styles.habitNumber}>
              <Text style={styles.habitNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.habitText}>{habit}</Text>
            <Check color={colors.muted} size={19} />
          </View>
        )}
        ListHeaderComponent={
          <>
            <AppHeader title="JOURNEY" onBack={navigation.goBack} />
            <JourneyArtwork journey={journey} />
            <Text style={styles.detailTitle}>{journey.title}</Text>
            <Text style={styles.detailDuration}>
              {journey.duration} • Guided routine
            </Text>
            <Text style={styles.description}>{journey.description}</Text>
            <Text style={styles.detailSection}>INCLUDED HABITS</Text>
          </>
        }
        ListFooterComponent={
          <>
            <View style={styles.info}>
              <Sparkles color={colors.primary} size={20} />
              <Text style={styles.infoText}>
                Starting a journey previews enrollment locally. You can add its
                habits individually from Today.
              </Text>
            </View>
            <AppButton
              title="START JOURNEY"
              onPress={() => navigation.goBack()}
              style={styles.start}
            />
          </>
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
