import React, { useMemo, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  View,
} from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import styles, { ITEM_HEIGHT } from './TimeWheelPickerStyle';

const hours = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, '0'),
);
const minutes = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, '0'),
);

function Wheel({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<FlashListRef<string>>(null);
  const index = Math.max(0, items.indexOf(value));
  const renderItem = ({ item }: { item: string }) => (
    <View style={styles.item}>
      <Text style={[styles.itemText, item === value && styles.selectedText]}>
        {item}
      </Text>
    </View>
  );
  const onEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.max(
      0,
      Math.min(
        items.length - 1,
        Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT),
      ),
    );
    onChange(items[next]);
    ref.current?.scrollToOffset({ offset: next * ITEM_HEIGHT, animated: true });
  };
  return (
    <FlashList
      ref={ref}
      data={items}
      keyExtractor={item => item}
      renderItem={renderItem}
      initialScrollIndex={index}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.wheelPadding}
      onMomentumScrollEnd={onEnd}
    />
  );
}

export function TimeWheelPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [hour, minute] = useMemo(() => value.split(':'), [value]);
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
