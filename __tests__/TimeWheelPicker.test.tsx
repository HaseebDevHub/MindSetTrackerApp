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
  afterEach(() => jest.restoreAllMocks());

  test('keeps native offsets stable and never starts a second animation during a gesture', () => {
    const scroll = jest
      .spyOn(FlatList.prototype, 'scrollToOffset')
      .mockImplementation(() => {});
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<PickerHarness initialValue="21:30" />);
    });
    const wheels = renderer!.root.findAllByType(FlatList);
    const offsets = wheels.map(wheel => wheel.props.contentOffset);
    scroll.mockClear();
    act(() => wheels[1].props.onScroll(scrollEvent(45.4)));
    act(() => wheels[1].props.onScrollEndDrag(scrollEvent(46.4)));
    act(() => wheels[1].props.onMomentumScrollEnd(scrollEvent(48)));
    expect(scroll).not.toHaveBeenCalled();
    renderer!.root.findAllByType(FlatList).forEach((wheel, index) => {
      expect(wheel.props.contentOffset).toBe(offsets[index]);
    });
    expect(
      renderer!.root.findByProps({ testID: 'selected-time' }).props.children,
    ).toBe('21:48');
    act(() => renderer!.unmount());
  });

  test('composes quick changes across all wheels before a render', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<PickerHarness initialValue="21:30" />);
    });
    const wheels = renderer!.root.findAllByType(FlatList);
    act(() => {
      wheels[0].props.onScroll(scrollEvent(9));
      wheels[1].props.onScroll(scrollEvent(59));
      wheels[2].props.onScroll(scrollEvent(0));
    });
    expect(
      renderer!.root.findByProps({ testID: 'selected-time' }).props.children,
    ).toBe('10:59');
    act(() => renderer!.unmount());
  });

  test('external value changes reposition wheels without animation', () => {
    const scroll = jest
      .spyOn(FlatList.prototype, 'scrollToOffset')
      .mockImplementation(() => {});
    const onChange = jest.fn();
    const render = (value: string) => (
      <ThemeProvider>
        <TimeWheelPicker value={value} onChange={onChange} />
      </ThemeProvider>
    );
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(render('08:00'));
    });
    scroll.mockClear();
    act(() => renderer!.update(render('23:59')));
    expect(scroll).toHaveBeenCalledWith({
      offset: 23 * ITEM_HEIGHT,
      animated: false,
    });
    expect(scroll).toHaveBeenCalledWith({
      offset: 59 * ITEM_HEIGHT,
      animated: false,
    });
    expect(onChange).not.toHaveBeenCalled();
    act(() => renderer!.unmount());
  });

  test('clamps edges and suppresses repeated values in 24-hour mode', () => {
    const onChange = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider>
          <TimeWheelPicker value="08:00" onChange={onChange} />
        </ThemeProvider>,
      );
    });
    const wheels = renderer!.root.findAllByType(FlatList);
    act(() => {
      wheels[0].props.onScroll(scrollEvent(-1));
      wheels[1].props.onScroll(scrollEvent(65));
      wheels[1].props.onMomentumScrollEnd(scrollEvent(65));
    });
    expect(onChange.mock.calls).toEqual([['00:00'], ['00:59']]);
    act(() => renderer!.unmount());
  });

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
