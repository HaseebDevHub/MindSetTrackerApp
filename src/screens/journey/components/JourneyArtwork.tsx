import React from 'react';
import { Text, View } from 'react-native';
import { ArrowRight, Footprints } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import type { Journey } from '../../../types/models';
import useStyles from '../JourneyScreenStyle';

export function JourneyArtwork({
  journey,
  compact = false,
}: {
  journey: Journey;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
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
        <Footprints color={colors.onPrimary} size={compact ? 24 : 34} />
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
            <ArrowRight color={colors.onPrimary} size={18} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
