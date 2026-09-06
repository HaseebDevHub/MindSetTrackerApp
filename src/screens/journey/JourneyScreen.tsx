import React, { useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { Sparkles } from 'lucide-react-native';
import {
  HorizontalListSeparator,
  VerticalListSeparator,
} from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ToastMessage } from '../../components/common/ToastMessage';
import { useTheme } from '../../context/ThemeContext';
import { journeys } from '../../data/mockData';
import { useTranslation } from '../../localization';
import { useAppStore } from '../../store/useAppStore';
import type {
  ActiveJourneyItem,
  Journey,
  JourneyId,
  JourneyStackParamList,
} from '../../types/models';
import { keyById } from '../../utils/lists';
import { JourneyArtwork } from './components/JourneyArtwork';
import { ActiveJourneyCard } from './components/ActiveJourneyCard';
import useStyles from './JourneyScreenStyle';

type Props = NativeStackScreenProps<JourneyStackParamList, 'JourneyHome'>;

type ActiveJourneyCardItem = {
  enrollment: ActiveJourneyItem;
  journey: Journey;
};

export function JourneyScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
  const styles = useStyles();
  const activeJourneys = useAppStore(state => state.activeJourneys);
  const activeCards = useMemo<ActiveJourneyCardItem[]>(
    () =>
      activeJourneys.flatMap(enrollment => {
        const journey = journeys.find(item => item.id === enrollment.journeyId);
        return journey ? [{ enrollment, journey }] : [];
      }),
    [activeJourneys],
  );
  const openJourney = useCallback(
    (journeyId: JourneyId) =>
      navigation.navigate('JourneyDetail', { journeyId }),
    [navigation],
  );
  const renderRecommended = useCallback(
    ({ item }: { item: Journey }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(item.titleKey)}
        onPress={() => openJourney(item.id)}
        style={isRTL ? styles.horizontalCardRTL : undefined}
      >
        <JourneyArtwork journey={item} />
      </Pressable>
    ),
    [isRTL, openJourney, styles.horizontalCardRTL, t],
  );
  const renderJourney = useCallback(
    ({ item }: { item: Journey }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(item.titleKey)}
        onPress={() => openJourney(item.id)}
      >
        <JourneyArtwork compact journey={item} />
      </Pressable>
    ),
    [openJourney, t],
  );
  const renderActiveJourney = useCallback(
    ({ item }: { item: ActiveJourneyCardItem }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('journey_continue_accessibility', {
          title: t(item.journey.titleKey),
        })}
        onPress={() =>
          navigation.navigate('ActiveJourney', {
            activeJourneyId: item.enrollment.id,
          })
        }
        style={isRTL ? styles.horizontalCardRTL : undefined}
      >
        <ActiveJourneyCard
          enrollment={item.enrollment}
          journey={item.journey}
        />
      </Pressable>
    ),
    [isRTL, navigation, styles.horizontalCardRTL, t],
  );
  return (
    <ScreenContainer padded={false}>
      <View style={[styles.header, isRTL && styles.rowRTL]}>
        <Text style={[styles.pageTitle, isRTL && styles.textRTL]}>
          {t('journey_title')}
        </Text>
        <Sparkles color={colors.primary} size={24} />
      </View>
      <FlashList
        data={journeys.slice(1)}
        renderItem={renderJourney}
        keyExtractor={keyById}
        ItemSeparatorComponent={VerticalListSeparator}
        ListHeaderComponent={
          <View style={styles.recommendedSection}>
            {activeCards.length ? (
              <>
                <Text style={[styles.section, isRTL && styles.textRTL]}>
                  {t('journey_active_journeys')}
                </Text>
                <FlashList
                  horizontal
                  data={activeCards}
                  inverted={isRTL}
                  renderItem={renderActiveJourney}
                  keyExtractor={item => item.enrollment.id}
                  ItemSeparatorComponent={
                    isRTL ? undefined : HorizontalListSeparator
                  }
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carousel}
                  style={styles.activeCarouselList}
                />
              </>
            ) : null}
            <Text style={[styles.section, isRTL && styles.textRTL]}>
              {t('journey_recommended_for_you')}
            </Text>
            <FlashList
              horizontal
              data={journeys.slice(0, 3)}
              inverted={isRTL}
              renderItem={renderRecommended}
              keyExtractor={keyById}
              ItemSeparatorComponent={
                isRTL ? undefined : HorizontalListSeparator
              }
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              style={styles.carouselList}
            />
            <Text
              style={[styles.section, styles.allTitle, isRTL && styles.textRTL]}
            >
              {t('journey_all_journeys')}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        style={styles.page}
      />
      <ToastMessage
        key={route.params?.toastRequestId}
        visible={Boolean(route.params?.toastMessage)}
        message={route.params?.toastMessage ?? ''}
        onDismiss={() =>
          navigation.setParams({
            toastMessage: undefined,
            toastRequestId: undefined,
          })
        }
        isRTL={isRTL}
      />
    </ScreenContainer>
  );
}
