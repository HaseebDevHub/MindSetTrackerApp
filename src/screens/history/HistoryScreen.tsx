import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SwipeableTabView } from '../../components/common/SwipeableTabView';
import { Achievements } from './components/Achievements';
import { AllHabits } from './components/AllHabits';
import { CalendarHistory } from './components/CalendarHistory';
import useStyles from './HistoryScreenStyle';

type Tab = 'Calendar' | 'All Habits' | 'Achievements';
const tabs: Tab[] = ['Calendar', 'All Habits', 'Achievements'];

export function HistoryScreen() {
  const styles = useStyles();
  const [currentIndex, setCurrentIndex] = useState(0);
  const tab = tabs[currentIndex];
  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>HISTORY</Text>
      </View>
      <View style={styles.tabs} accessibilityRole="tablist">
        {tabs.map((item, index) => (
          <Pressable
            key={item}
            accessibilityLabel={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === item }}
            onPress={() => setCurrentIndex(index)}
            style={[styles.tab, tab === item && styles.activeTab]}
          >
            <Text
              style={[styles.tabText, tab === item && styles.activeTabText]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
      <SwipeableTabView
        currentIndex={currentIndex}
        onIndexChange={setCurrentIndex}
      >
        <CalendarHistory />
        <AllHabits />
        <Achievements />
      </SwipeableTabView>
    </ScreenContainer>
  );
}
