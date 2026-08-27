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
            accessibilityLabel="Close"
            onPress={onClose}
            style={styles.close}
          >
            <X color={colors.textSecondary} size={21} />
          </Pressable>
          <View style={styles.icon}>
            <Award color={colors.yellow} size={38} />
          </View>
          <Text style={styles.congratulations}>Congratulations!</Text>
          <Text style={styles.subtitle}>{celebration?.subtitle}</Text>
          <Text style={styles.title}>{celebration?.title}</Text>
          <AppButton title="CLOSE" onPress={onClose} style={styles.button} />
          <Pressable onPress={onViewAchievements}>
            <Text style={styles.link}>My achievements</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
