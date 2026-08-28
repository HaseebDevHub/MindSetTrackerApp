import React from 'react';
import { Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import useStyles from './TabBarComponentsStyle';

export const renderTabIcon =
  (Icon: LucideIcon) =>
  ({ color, focused }: { color: string; focused: boolean }) =>
    (
      <Icon
        color={color}
        size={focused ? 24 : 22}
        strokeWidth={focused ? 2.5 : 2}
      />
    );

export function TabLabel({
  children,
  color,
}: {
  children: string;
  color: string;
}) {
  const styles = useStyles();

  return (
    <Text style={[styles.tabLabel, { color }]}>
      {String(children).toUpperCase()}
    </Text>
  );
}
