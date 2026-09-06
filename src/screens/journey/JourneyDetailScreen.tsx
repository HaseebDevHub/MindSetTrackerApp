import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Sparkles,
} from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import { SmallVerticalListSeparator } from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ToastMessage } from '../../components/common/ToastMessage';
import { useTheme } from '../../context/ThemeContext';
import { journeys } from '../../data/mockData';
import { useTranslation } from '../../localization';
import type { JourneyStackParamList } from '../../types/models';
import { useAppStore } from '../../store/useAppStore';
import { keyById } from '../../utils/lists';
import { JourneyArtwork } from './components/JourneyArtwork';
import useStyles from './JourneyScreenStyle';

type Props = NativeStackScreenProps<JourneyStackParamList, 'JourneyDetail'>;

export function JourneyDetailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
  const styles = useStyles();
  const journey =
    journeys.find(item => item.id === route.params.journeyId) ?? journeys[0];
  const activeJourney = useAppStore(state =>
    state.activeJourneys.find(item => item.journeyId === journey.id),
  );
  const startJourney = useAppStore(state => state.startJourney);
  const [isStarting, setIsStarting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string>();

  const handleStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    const enrollment = await startJourney(journey.id);
    setIsStarting(false);
    if (!enrollment) {
      setErrorMessage(t('journey_start_error'));
      return;
    }
    navigation.navigate('ActiveJourney', {
      activeJourneyId: enrollment.id,
    });
  };
  return (
    <ScreenContainer style={styles.detailPage}>
      <FlashList
        data={journey.habits}
        keyExtractor={keyById}
        ItemSeparatorComponent={SmallVerticalListSeparator}
        renderItem={({ item: habit, index }) => (
          <View style={[styles.habit, isRTL && styles.rowRTL]}>
            <View style={styles.habitNumber}>
              <Text style={styles.habitNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.habitCopy}>
              <Text style={[styles.habitText, isRTL && styles.textRTL]}>
                {t(habit.titleKey)}
              </Text>
              <View style={[styles.habitGuidance, isRTL && styles.rowRTL]}>
                <Clock3 color={colors.muted} size={14} />
                <Text
                  style={[styles.habitGuidanceText, isRTL && styles.textRTL]}
                >
                  {t(habit.subtitleKey)}
                </Text>
              </View>
            </View>
            <View style={styles.habitCheck}>
              <Check color={colors.primary} size={20} />
            </View>
          </View>
        )}
        ListHeaderComponent={
          <>
            <View style={[styles.detailHeader, isRTL && styles.rowRTL]}>
              <Pressable
                accessibilityLabel={t('common_back')}
                accessibilityRole="button"
                hitSlop={8}
                onPress={navigation.goBack}
                style={styles.detailHeaderButton}
              >
                {isRTL ? (
                  <ChevronRight color={colors.text} size={25} />
                ) : (
                  <ChevronLeft color={colors.text} size={25} />
                )}
              </Pressable>
              <Text
                style={[
                  styles.detailHeaderTitle,
                  isRTL && styles.centeredTextRTL,
                ]}
              >
                {t('journey_title')}
              </Text>
              <View style={styles.detailHeaderSpacer} />
            </View>
            <JourneyArtwork backgroundImage journey={journey} />
            <Text style={[styles.detailTitle, isRTL && styles.textRTL]}>
              {t(journey.titleKey)}
            </Text>
            <View style={[styles.detailMetadata, isRTL && styles.rowRTL]}>
              <View style={[styles.detailMetadataItem, isRTL && styles.rowRTL]}>
                <CalendarDays color={colors.primary} size={17} />
                <Text style={[styles.detailDuration, isRTL && styles.textRTL]}>
                  {t('journey_duration_days', { count: journey.durationDays })}
                </Text>
              </View>
              <Text style={styles.metadataDot}>•</Text>
              <Text
                style={[styles.detailMetadataText, isRTL && styles.textRTL]}
              >
                {t('journey_guided_routine')}
              </Text>
              <Text style={styles.metadataDot}>•</Text>
              <View style={styles.dailyHabitsBadge}>
                <Text style={[styles.dailyHabitsText, isRTL && styles.textRTL]}>
                  {t('journey_daily_habits', {
                    count: journey.habits.length,
                  })}
                </Text>
              </View>
            </View>
            <Text style={[styles.description, isRTL && styles.textRTL]}>
              {t(journey.descriptionKey)}
            </Text>
            <View style={[styles.detailSectionRow, isRTL && styles.rowRTL]}>
              <Text style={[styles.detailSection, isRTL && styles.textRTL]}>
                {t('journey_included_habits')}
              </Text>
              <View style={styles.habitCountBadge}>
                <Text style={[styles.habitCountText, isRTL && styles.textRTL]}>
                  {t('journey_habits_count', {
                    count: journey.habits.length,
                  })}
                </Text>
              </View>
            </View>
          </>
        }
        ListFooterComponent={
          <View style={{backgroundColor: colors.background, paddingBottom: 40}}>
            <View style={[styles.info, isRTL && styles.rowRTL]}>
              <Sparkles color={colors.primary} size={20} />
              <Text style={[styles.infoText, isRTL && styles.textRTL]}>
                {t('journey_guidance')}
              </Text>
            </View>
            <AppButton
              title={activeJourney ? t('journey_continue') : t('journey_start')}
              loading={isStarting}
              onPress={handleStart}
              style={styles.start}
            />
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
      <ToastMessage
        visible={Boolean(errorMessage)}
        message={errorMessage ?? ''}
        type="error"
        onDismiss={() => setErrorMessage(undefined)}
        isRTL={isRTL}
      />
    </ScreenContainer>
  );
}
