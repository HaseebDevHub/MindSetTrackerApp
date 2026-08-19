import React, { useCallback, useEffect, useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styles from './SwipeableTabViewStyle';

const DEFAULT_DISTANCE_THRESHOLD = 56;
const DEFAULT_VELOCITY_THRESHOLD = 650;
const DEFAULT_ANIMATION_DURATION = 240;
const MIN_FAST_SWIPE_DISTANCE = 12;

export function getSwipeTargetIndex(
  currentIndex: number,
  itemCount: number,
  translationX: number,
  velocityX: number,
  distanceThreshold = DEFAULT_DISTANCE_THRESHOLD,
  velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
) {
  'worklet';
  const isDistanceSwipe = Math.abs(translationX) >= distanceThreshold;
  const isVelocitySwipe =
    Math.abs(translationX) >= MIN_FAST_SWIPE_DISTANCE &&
    Math.abs(velocityX) >= velocityThreshold;

  if (!isDistanceSwipe && !isVelocitySwipe) return currentIndex;

  const direction = isDistanceSwipe ? translationX : velocityX;
  const requestedIndex = currentIndex + (direction < 0 ? 1 : -1);
  return Math.max(0, Math.min(itemCount - 1, requestedIndex));
}

type Props = {
  children: React.ReactNode;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  animationDuration?: number;
  distanceThreshold?: number;
  velocityThreshold?: number;
};

export function SwipeableTabView({
  children,
  currentIndex,
  onIndexChange,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  distanceThreshold = DEFAULT_DISTANCE_THRESHOLD,
  velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
}: Props) {
  const { width } = useWindowDimensions();
  const pages = useMemo(() => React.Children.toArray(children), [children]);
  const itemCount = pages.length;
  const translateX = useSharedValue(-currentIndex * width);
  const gestureStartX = useSharedValue(translateX.value);
  const animatedIndex = useSharedValue(currentIndex);

  useEffect(() => {
    animatedIndex.value = currentIndex;
    translateX.value = withTiming(-currentIndex * width, {
      duration: animationDuration,
    });
  }, [
    animatedIndex,
    animationDuration,
    currentIndex,
    itemCount,
    translateX,
    width,
  ]);

  const updateIndex = useCallback(
    (index: number) => onIndexChange(index),
    [onIndexChange],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-18, 18])
        .failOffsetY([-12, 12])
        .onBegin(() => {
          cancelAnimation(translateX);
          gestureStartX.value = translateX.value;
        })
        .onUpdate(event => {
          const minimumPosition = -(itemCount - 1) * width;
          const maximumPosition = 0;
          let nextPosition = gestureStartX.value + event.translationX;

          if (nextPosition < minimumPosition) {
            nextPosition =
              minimumPosition + (nextPosition - minimumPosition) * 0.18;
          } else if (nextPosition > maximumPosition) {
            nextPosition =
              maximumPosition + (nextPosition - maximumPosition) * 0.18;
          }
          translateX.value = nextPosition;
        })
        .onEnd(event => {
          const previousIndex = animatedIndex.value;
          const targetIndex = getSwipeTargetIndex(
            previousIndex,
            itemCount,
            event.translationX,
            event.velocityX,
            distanceThreshold,
            velocityThreshold,
          );
          animatedIndex.value = targetIndex;
          translateX.value = withTiming(-targetIndex * width, {
            duration: animationDuration,
          });
          if (targetIndex !== previousIndex) {
            runOnJS(updateIndex)(targetIndex);
          }
        })
        .onFinalize((_, success) => {
          if (!success) {
            translateX.value = withTiming(-animatedIndex.value * width, {
              duration: animationDuration,
            });
          }
        }),
    [
      animatedIndex,
      animationDuration,
      distanceThreshold,
      gestureStartX,
      itemCount,
      translateX,
      updateIndex,
      velocityThreshold,
      width,
    ],
  );
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.viewport}>
        <Animated.View
          style={[styles.track, { width: width * itemCount }, animatedStyle]}
        >
          {pages.map((page, logicalIndex) => {
            const active = logicalIndex === currentIndex;
            return (
              <View
                key={logicalIndex}
                accessibilityElementsHidden={!active}
                importantForAccessibility={
                  active ? 'auto' : 'no-hide-descendants'
                }
                pointerEvents={active ? 'auto' : 'none'}
                style={[styles.page, { width }]}
              >
                {page}
              </View>
            );
          })}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
