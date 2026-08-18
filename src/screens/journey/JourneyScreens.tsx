import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowRight, Check, Footprints, Sparkles } from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { colors } from '../../constants/theme';
import { journeys } from '../../data/mockData';
import type { Journey, JourneyStackParamList } from '../../types/models';
import styles from './JourneyScreenStyle';

type Props<T extends keyof JourneyStackParamList> = NativeStackScreenProps<
  JourneyStackParamList,
  T
>;

function JourneyArtwork({
  journey,
  compact = false,
}: {
  journey: Journey;
  compact?: boolean;
}) {
  return (
    <View
      style={[
        styles.art,
        { backgroundColor: journey.colors[0] },
        compact && styles.compact,
      ]}
    >
      <View style={[styles.orb, { backgroundColor: journey.colors[1] }]} />
      <View style={styles.artIcon}>
        <Footprints color={colors.text} size={compact ? 24 : 34} />
      </View>
      <View style={styles.cardCopy}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{journey.duration}</Text>
        </View>
        <Text
          numberOfLines={compact ? 2 : 3}
          style={[styles.cardTitle, compact && styles.compactTitle]}
        >
          {journey.title.toUpperCase()}
        </Text>
        {!compact ? (
          <View style={styles.explore}>
            <Text style={styles.exploreText}>EXPLORE JOURNEY</Text>
            <ArrowRight color={colors.text} size={18} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function JourneyScreen({ navigation }: Props<'JourneyHome'>) {
  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>JOURNEY</Text>
        <Sparkles color={colors.primary} size={24} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.page}
      >
        <Text style={styles.section}>RECOMMENDED FOR YOU</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          {journeys.slice(0, 3).map(item => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.title}
              key={item.id}
              onPress={() =>
                navigation.navigate('JourneyDetail', { journeyId: item.id })
              }
            >
              <JourneyArtwork journey={item} />
            </Pressable>
          ))}
        </ScrollView>
        <Text style={[styles.section, styles.allTitle]}>ALL JOURNEYS</Text>
        <View style={styles.list}>
          {journeys.slice(1).map(item => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() =>
                navigation.navigate('JourneyDetail', { journeyId: item.id })
              }
            >
              <JourneyArtwork compact journey={item} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

export function JourneyDetailScreen({
  navigation,
  route,
}: Props<'JourneyDetail'>) {
  const journey =
    journeys.find(item => item.id === route.params.journeyId) ?? journeys[0];
  return (
    <ScreenContainer scroll style={styles.detailPage}>
      <AppHeader title="JOURNEY" onBack={navigation.goBack} />
      <JourneyArtwork journey={journey} />
      <Text style={styles.detailTitle}>{journey.title}</Text>
      <Text style={styles.detailDuration}>
        {journey.duration} • Guided routine
      </Text>
      <Text style={styles.description}>{journey.description}</Text>
      <Text style={styles.section}>INCLUDED HABITS</Text>
      <View style={styles.habits}>
        {journey.habits.map((habit, index) => (
          <View key={habit} style={styles.habit}>
            <View style={styles.habitNumber}>
              <Text style={styles.habitNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.habitText}>{habit}</Text>
            <Check color={colors.muted} size={19} />
          </View>
        ))}
      </View>
      <View style={styles.info}>
        <Sparkles color={colors.primary} size={20} />
        <Text style={styles.infoText}>
          Starting a journey previews enrollment locally. You can add its habits
          individually from Today.
        </Text>
      </View>
      <AppButton
        title="START JOURNEY"
        onPress={() => navigation.goBack()}
        style={styles.start}
      />
    </ScreenContainer>
  );
}
