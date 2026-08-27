import React, {
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

function Wheel({
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

  const onEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = indexForOffset(
        event.nativeEvent.contentOffset.y,
        items.length,
      );
      selectIndex(next);
      ref.current?.scrollToOffset({
        offset: next * ITEM_HEIGHT,
        animated: true,
      });
    },
    [items.length, selectIndex],
  );

  const onDragEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocity = Math.abs(event.nativeEvent.velocity?.y ?? 0);
      if (velocity < 0.05) onEnd(event);
    },
    [onEnd],
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
      contentOffset={{ x: 0, y: index * ITEM_HEIGHT }}
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
      onMomentumScrollEnd={onEnd}
      onScrollEndDrag={onDragEnd}
    />
  );
}

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

  if (use12Hour) {
    return (
      <View style={styles.container}>
        <View pointerEvents="none" style={styles.selection} />
        <Wheel
          items={twelveHourHours}
          value={twelveHour.hour}
          onChange={next =>
            onChange(
              fromTwelveHourTime(next, twelveHour.minute, twelveHour.period),
            )
          }
        />
        <Text style={styles.colon}>:</Text>
        <Wheel
          items={minutes}
          value={twelveHour.minute}
          onChange={next =>
            onChange(
              fromTwelveHourTime(twelveHour.hour, next, twelveHour.period),
            )
          }
        />
        <Wheel
          items={periods}
          value={twelveHour.period}
          onChange={next =>
            onChange(
              fromTwelveHourTime(
                twelveHour.hour,
                twelveHour.minute,
                next as DayPeriod,
              ),
            )
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.selection} />
      <Wheel
        items={hours}
        value={hour}
        onChange={next => onChange(`${next}:${minute}`)}
      />
      <Text style={styles.colon}>:</Text>
      <Wheel
        items={minutes}
        value={minute}
        onChange={next => onChange(`${hour}:${next}`)}
      />
    </View>
  );
}
