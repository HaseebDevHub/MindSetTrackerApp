import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Award, X } from 'lucide-react-native';
import type { Celebration } from '../../types/models';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../localization';
import { AppButton } from './AppButton';
import useStyles from './CelebrationModalStyle';

export function CelebrationModal({
  celebration,
  onClose,
  onViewAchievements,
}: {
  celebration?: Celebration;
  onClose: () => void;
  onViewAchievements: () => void;
}) {
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        id: index,
        left: 20 + ((index * 47) % Math.max(40, width - 60)),
        delay: (index % 4) * 70,
        color: [colors.primary, colors.yellow, colors.green, colors.red][
          index % 4
        ],
      })),
    [colors, width],
  );

  useEffect(() => {
    if (!celebration) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, [celebration, progress]);

  return (
    <Modal
      transparent
      visible={Boolean(celebration)}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {particles.map(particle => (
          <Animated.View
            key={particle.id}
            pointerEvents="none"
            style={[
              styles.confetti,
              {
                left: particle.left,
                backgroundColor: particle.color,
                opacity: progress.interpolate({
                  inputRange: [0, 0.15, 1],
                  outputRange: [0, 1, 0],
                }),
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-80 - particle.delay, 420],
                    }),
                  },
                  {
                    rotate: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${180 + particle.id * 35}deg`],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
        <View style={styles.card}>
          <Pressable
            accessibilityLabel={t('common_close')}
            onPress={onClose}
            style={[styles.close, isRTL && styles.closeRTL]}
          >
            <X color={colors.textSecondary} size={21} />
          </Pressable>
          <View style={styles.icon}>
            <Award color={colors.yellow} size={38} />
          </View>
          <Text
            style={[styles.congratulations, isRTL && styles.centeredTextRTL]}
          >
            {t('celebration_congratulations')}
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.centeredTextRTL]}>
            {celebration?.subtitle}
          </Text>
          <Text style={[styles.title, isRTL && styles.centeredTextRTL]}>
            {celebration?.title}
          </Text>
          <AppButton
            title={t('common_close')}
            onPress={onClose}
            style={styles.button}
          />
          <Pressable onPress={onViewAchievements}>
            <Text style={[styles.link, isRTL && styles.centeredTextRTL]}>
              {t('celebration_my_achievements')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
