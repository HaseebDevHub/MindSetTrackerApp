import React from 'react';
import { View } from 'react-native';
import styles from './ListSeparatorStyle';

export function VerticalListSeparator() {
  return <View style={styles.vertical} />;
}

export function HorizontalListSeparator() {
  return <View style={styles.horizontal} />;
}

export function SmallVerticalListSeparator() {
  return <View style={styles.smallVertical} />;
}
