import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { Sparkles } from 'lucide-react-native';
import {
  HorizontalListSeparator,
  VerticalListSeparator,
} from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useTheme } from '../../context/ThemeContext';
import { journeys } from '../../data/mockData';
import type { Journey, JourneyStackParamList } from '../../types/models';
import { keyById } from '../../utils/lists';
import { JourneyArtwork } from './components/JourneyArtwork';
import useStyles from './JourneyScreenStyle';

type Props = NativeStackScreenProps<JourneyStackParamList, 'JourneyHome'>;

export function JourneyScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const openJourney = useCallback(
    (journeyId: string) => navigation.navigate('JourneyDetail', { journeyId }),
    [navigation],
  );
  const renderRecommended = useCallback(
    ({ item }: { item: Journey }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title}
        onPress={() => openJourney(item.id)}
      >
        <JourneyArtwork journey={item} />
      </Pressable>
    ),
    [openJourney],
  );
  const renderJourney = useCallback(
    ({ item }: { item: Journey }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title}
        onPress={() => openJourney(item.id)}
      >
        <JourneyArtwork compact journey={item} />
      </Pressable>
    ),
    [openJourney],
  );
  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>JOURNEY</Text>
        <Sparkles color={colors.primary} size={24} />
      </View>
      <FlashList
        data={journeys.slice(1)}
        renderItem={renderJourney}
        keyExtractor={keyById}
        ItemSeparatorComponent={VerticalListSeparator}
        ListHeaderComponent={
          <View style={styles.recommendedSection}>
            <Text style={styles.section}>RECOMMENDED FOR YOU</Text>
            <FlashList
              horizontal
              data={journeys.slice(0, 3)}
              renderItem={renderRecommended}
              keyExtractor={keyById}
              ItemSeparatorComponent={HorizontalListSeparator}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              style={styles.carouselList}
            />
            <Text style={[styles.section, styles.allTitle]}>ALL JOURNEYS</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        style={styles.page}
      />
    </ScreenContainer>
  );
}
