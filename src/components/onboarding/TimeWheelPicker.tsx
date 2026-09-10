import React, {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  View,
} from 'react-native';
import {
  fromTwelveHourTime,
  toTwelveHourTime,
  type DayPeriod,
} from '../../utils/time';
import useStyles, { ITEM_HEIGHT } from './TimeWheelPickerStyle';

const hours = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, '0'),
);
const minutes = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, '0'),
);
const twelveHourHours = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, '0'),
);
const periods: DayPeriod[] = ['AM', 'PM'];
function indexForOffset(offset: number, itemCount: number) {
  return Math.max(0, Math.min(itemCount - 1, Math.round(offset / ITEM_HEIGHT)));
}

const Wheel = memo(function TimeWheel({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const styles = useStyles();
  const ref = useRef<FlatList<string>>(null);
  const index = Math.max(0, items.indexOf(value));
  // A starting offset, not a controlled scroll position. Updating this while
  // dragging interrupts the native gesture/deceleration on both platforms.
  const initialOffset = useRef({ x: 0, y: index * ITEM_HEIGHT }).current;
  const activeIndexRef = useRef(index);
  const [activeIndex, setActiveIndex] = useState(index);

  const selectIndex = useCallback(
    (nextIndex: number) => {
      if (nextIndex === activeIndexRef.current) return;

      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      onChange(items[nextIndex]);
    },
    [items, onChange],
  );

  useLayoutEffect(() => {
    if (index === activeIndexRef.current) return;

    activeIndexRef.current = index;
    setActiveIndex(index);
    ref.current?.scrollToOffset({
      offset: index * ITEM_HEIGHT,
      animated: false,
    });
  }, [index]);

  const renderItem = useCallback(
    ({ item, index: itemIndex }: { item: string; index: number }) => (
      <View style={styles.item}>
        <Text
          style={[
            styles.itemText,
            itemIndex === activeIndex && styles.selectedText,
          ]}
        >
          {item}
        </Text>
      </View>
    ),
    [activeIndex, styles],
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      selectIndex(
        indexForOffset(event.nativeEvent.contentOffset.y, items.length),
      );
    },
    [items.length, selectIndex],
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<string> | null | undefined, itemIndex: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * itemIndex,
      index: itemIndex,
    }),
    [],
  );

  return (
    <FlatList
      ref={ref}
      data={items}
      extraData={activeIndex}
      keyExtractor={item => item}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      contentOffset={initialOffset}
      initialScrollIndex={initialOffset.y / ITEM_HEIGHT}
      removeClippedSubviews={false}
      snapToInterval={ITEM_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      nestedScrollEnabled
      bounces={false}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.wheelPadding}
      style={styles.wheel}
      onScroll={onScroll}
      scrollEventThrottle={16}
      // Native snapping owns settling. Starting another animation here can
      // interrupt momentum or produce a scroll-end/scrollToOffset loop.
      onMomentumScrollEnd={onScroll}
      onScrollEndDrag={onScroll}
    />
  );
});

export function TimeWheelPicker({
  value,
  onChange,
  use12Hour = false,
}: {
  value: string;
  onChange: (value: string) => void;
  use12Hour?: boolean;
}) {
  const styles = useStyles();
  const [hour, minute] = useMemo(() => value.split(':'), [value]);
  const twelveHour = useMemo(() => toTwelveHourTime(value), [value]);
  const latestValue = useRef(value);
  useLayoutEffect(() => {
    latestValue.current = value;
  }, [value]);

  const changePart = useCallback(
    (part: 'hour' | 'minute' | 'period', next: string) => {
      let updated: string;
      if (use12Hour) {
        const current = toTwelveHourTime(latestValue.current);
        updated = fromTwelveHourTime(
          part === 'hour' ? next : current.hour,
          part === 'minute' ? next : current.minute,
          part === 'period' ? (next as DayPeriod) : current.period,
        );
      } else {
        const [currentHour, currentMinute] = latestValue.current.split(':');
        updated = `${part === 'hour' ? next : currentHour}:${
          part === 'minute' ? next : currentMinute
        }`;
      }
      // Multiple wheels may emit before React commits the controlled value.
      // Compose with the latest selection, not a stale render's other fields.
      if (updated === latestValue.current) return;
      latestValue.current = updated;
      onChange(updated);
    },
    [onChange, use12Hour],
  );
  const changeHour = useCallback(
    (next: string) => changePart('hour', next),
    [changePart],
  );
  const changeMinute = useCallback(
    (next: string) => changePart('minute', next),
    [changePart],
  );
  const changePeriod = useCallback(
    (next: string) => changePart('period', next),
    [changePart],
  );

  if (use12Hour) {
    return (
      <View style={styles.container}>
        <View pointerEvents="none" style={styles.selection} />
        <Wheel
          items={twelveHourHours}
          value={twelveHour.hour}
          onChange={changeHour}
        />
        <Text style={styles.colon}>:</Text>
        <Wheel
          items={minutes}
          value={twelveHour.minute}
          onChange={changeMinute}
        />
        <Wheel
          items={periods}
          value={twelveHour.period}
          onChange={changePeriod}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.selection} />
      <Wheel items={hours} value={hour} onChange={changeHour} />
      <Text style={styles.colon}>:</Text>
      <Wheel items={minutes} value={minute} onChange={changeMinute} />
    </View>
  );
}
