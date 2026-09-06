import React from 'react';
import { Image, Text, View } from 'react-native';
import { Clock3 } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { journeyImages } from '../../../data/journeyImages';
import { useTranslation } from '../../../localization';
import type { Journey } from '../../../types/models';
import useStyles from '../JourneyScreenStyle';

export function JourneyArtwork({
  journey,
  compact = false,
  backgroundImage = false,
}: {
  journey: Journey;
  compact?: boolean;
  backgroundImage?: boolean;
}) {
  const { colors } = useTheme();
  const { isRTL, locale, t } = useTranslation();
  const styles = useStyles();

  const cardCopy = (
    <View
      style={[
        styles.cardCopy,
        isRTL && styles.cardCopyRTL,
        backgroundImage && styles.detailCardCopy,
      ]}
    >
      <View
        style={[
          styles.badge,
          isRTL && styles.badgeRTL,
          backgroundImage && styles.detailHeroBadge,
          backgroundImage && isRTL && styles.rowRTL,
        ]}
      >
        {backgroundImage ? (
          <Clock3 color={colors.onPrimaryMuted} size={14} />
        ) : null}
        <Text style={[styles.badgeText, isRTL && styles.textRTL]}>
          {t('journey_duration_days', { count: journey.durationDays })}
        </Text>
      </View>
      <Text
        numberOfLines={compact ? 2 : 3}
        style={[
          styles.cardTitle,
          compact && styles.compactTitle,
          backgroundImage && styles.detailHeroTitle,
          isRTL && styles.textRTL,
        ]}
      >
        {t(journey.titleKey).toLocaleUpperCase(locale)}
      </Text>
    </View>
  );

  if (backgroundImage) {
    return (
      <View
        style={[
          styles.art,
          styles.detailPageArt,
          { backgroundColor: journey.colors[0] },
        ]}
      >
        <Image
          resizeMode="cover"
          source={journeyImages[journey.id]}
          style={styles.detailBackgroundImage}
        />
        <View style={styles.detailArtworkOverlay} />
        {cardCopy}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.art,
        { backgroundColor: journey.colors[0] },
        compact && styles.compact,
      ]}
    >
      <View
        style={[
          styles.orb,
          isRTL && styles.orbRTL,
          { backgroundColor: journey.colors[1] },
        ]}
      />
      <View style={[styles.artIcon, isRTL && styles.artIconRTL]}>
        <Image
          resizeMode="cover"
          source={journeyImages[journey.id]}
          style={[styles.journeyImage, compact && styles.compactJourneyImage]}
        />
      </View>
      {cardCopy}
    </View>
  );
}
