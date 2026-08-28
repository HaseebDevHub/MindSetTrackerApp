import React from 'react';
import { StyleSheet } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { AppButton } from '../src/components/common/AppButton';
import { ThemeProvider } from '../src/context/ThemeContext';
import { darkColors } from '../src/constants/theme';

function findTouchable(
  renderer: TestRenderer.ReactTestRenderer,
  accessibilityLabel: string,
) {
  return renderer.root
    .findAll(node => node.props.accessibilityLabel === accessibilityLabel)
    .find(
      node =>
        typeof node.props.onPress === 'function' && node.props.style != null,
    )!;
}

describe('AppButton', () => {
  test.each([
    ['primary', darkColors.primary],
    ['secondary', darkColors.surfaceSecondary],
    ['ghost', darkColors.transparent],
  ] as const)('owns the full visible bounds for the %s variant', (variant, backgroundColor) => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <AppButton title="CONTINUE" variant={variant} onPress={jest.fn()} />
        </ThemeProvider>,
      );
    });

    const button = findTouchable(renderer!, 'CONTINUE');
    const buttonStyle =
      typeof button.props.style === 'function'
        ? button.props.style({ pressed: false })
        : button.props.style;
    expect(StyleSheet.flatten(buttonStyle)).toMatchObject({
      width: '100%',
      alignSelf: 'stretch',
      minHeight: 54,
      backgroundColor,
    });

    act(() => renderer!.unmount());
  });

  test('forwards presses through the Pressable container', () => {
    const onPress = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <AppButton title="NEXT" onPress={onPress} />
        </ThemeProvider>,
      );
    });

    const button = findTouchable(renderer!, 'NEXT');
    act(() => button.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);

    act(() => renderer!.unmount());
  });
});
