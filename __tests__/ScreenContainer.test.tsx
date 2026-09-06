import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../src/components/common/ScreenContainer';
import { ThemeProvider } from '../src/context/ThemeContext';
import { TabScreenProvider } from '../src/context/TabScreenContext';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderContainer(insideTabNavigator: boolean) {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <ThemeProvider initialMode="dark">
          <TabScreenProvider value={insideTabNavigator}>
            <ScreenContainer>
              <Text>Content</Text>
            </ScreenContainer>
          </TabScreenProvider>
        </ThemeProvider>
      </SafeAreaProvider>,
    );
  });
  return renderer!;
}

test('does not apply the bottom inset twice inside the tab navigator', () => {
  const renderer = renderContainer(true);
  expect(renderer.root.findByType(SafeAreaView).props.edges).toEqual([
    'top',
    'left',
    'right',
  ]);
  act(() => renderer.unmount());
});

test('retains the bottom inset outside the tab navigator', () => {
  const renderer = renderContainer(false);
  expect(renderer.root.findByType(SafeAreaView).props.edges).toEqual([
    'top',
    'left',
    'right',
    'bottom',
  ]);
  act(() => renderer.unmount());
});
