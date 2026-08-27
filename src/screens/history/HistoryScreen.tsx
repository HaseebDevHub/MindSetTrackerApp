import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SwipeableTabView } from '../../components/common/SwipeableTabView';
import { Achievements } from './components/Achievements';
import { AllHabits } from './components/AllHabits';
import { CalendarHistory } from './components/CalendarHistory';
import useStyles from './HistoryScreenStyle';

import type { HistoryTab } from '../../types/models';

type Tab = HistoryTab;
const tabs: Tab[] = ['Calendar', 'All Habits', 'Achievements'];

export function HistoryScreen({
  initialTab,
  tabRequestId,
}: { initialTab?: HistoryTab; tabRequestId?: number } = {}) {
  const styles = useStyles();
  const [currentIndex, setCurrentIndex] = useState(() =>
    initialTab ? tabs.indexOf(initialTab) : 0,
  );
  useEffect(() => {
    if (initialTab) setCurrentIndex(tabs.indexOf(initialTab));
  }, [initialTab, tabRequestId]);
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
