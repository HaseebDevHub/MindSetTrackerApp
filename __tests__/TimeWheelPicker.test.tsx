import React, { useState } from 'react';
import { FlatList, Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { TimeWheelPicker } from '../src/components/onboarding/TimeWheelPicker';
import { ITEM_HEIGHT } from '../src/components/onboarding/TimeWheelPickerStyle';
import { ThemeProvider } from '../src/context/ThemeContext';

function PickerHarness({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);

  return (
    <ThemeProvider initialMode="dark">
      <TimeWheelPicker use12Hour value={value} onChange={setValue} />
      <Text testID="selected-time">{value}</Text>
    </ThemeProvider>
  );
}

function scrollEvent(index: number) {
  return { nativeEvent: { contentOffset: { x: 0, y: index * ITEM_HEIGHT } } };
}

describe('TimeWheelPicker', () => {
  test('positions 12-hour wheels from a 24-hour value', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<PickerHarness initialValue="21:30" />);
    });

    const wheels = renderer!.root.findAllByType(FlatList);
    expect(wheels).toHaveLength(3);
    expect(wheels.map(wheel => wheel.props.contentOffset.y)).toEqual([
      8 * ITEM_HEIGHT,
      30 * ITEM_HEIGHT,
      ITEM_HEIGHT,
    ]);

    act(() => renderer!.unmount());
  });

  test('updates hour, minute, and period independently while scrolling', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<PickerHarness initialValue="21:30" />);
    });

    let wheels = renderer!.root.findAllByType(FlatList);
    act(() => wheels[0].props.onScroll(scrollEvent(9)));
    expect(
      renderer!.root.findByProps({ testID: 'selected-time' }).props.children,
    ).toBe('22:30');

    wheels = renderer!.root.findAllByType(FlatList);
    act(() => wheels[1].props.onScroll(scrollEvent(15)));
    expect(
      renderer!.root.findByProps({ testID: 'selected-time' }).props.children,
    ).toBe('22:15');

    wheels = renderer!.root.findAllByType(FlatList);
    act(() => wheels[2].props.onScroll(scrollEvent(0)));
    expect(
      renderer!.root.findByProps({ testID: 'selected-time' }).props.children,
    ).toBe('10:15');

    act(() => renderer!.unmount());
  });
});
