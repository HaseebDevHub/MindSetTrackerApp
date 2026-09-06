import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SwipeableTabView } from '../../components/common/SwipeableTabView';
import { Achievements } from './components/Achievements';
import { AllHabits } from './components/AllHabits';
import { CalendarHistory } from './components/CalendarHistory';
import { useTranslation, type TranslationKey } from '../../localization';
import useStyles from './HistoryScreenStyle';

import type { HistoryTab } from '../../types/models';

type Tab = HistoryTab;
const tabs: Tab[] = ['Calendar', 'All Habits', 'Achievements'];
const tabTranslationKeys: Record<Tab, TranslationKey> = {
  Calendar: 'history_tab_calendar',
  'All Habits': 'history_tab_all_habits',
  Achievements: 'history_tab_achievements',
};

export function HistoryScreen({
  initialTab,
  tabRequestId,
  onDateSelected,
}: {
  initialTab?: HistoryTab;
  tabRequestId?: number;
  onDateSelected?: (dateKey: string) => void;
} = {}) {
  const styles = useStyles();
  const { isRTL, t } = useTranslation();
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
        <Text style={[styles.pageTitle, isRTL && styles.textRTL]}>
          {t('history_title')}
        </Text>
      </View>
      <View
        style={[styles.tabs, isRTL && styles.rowRTL]}
        accessibilityRole="tablist"
      >
        {tabs.map((item, index) => (
          <Pressable
            key={item}
            accessibilityLabel={t(tabTranslationKeys[item])}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === item }}
            onPress={() => setCurrentIndex(index)}
            style={[styles.tab, tab === item && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                isRTL && styles.centeredTextRTL,
                tab === item && styles.activeTabText,
              ]}
            >
              {t(tabTranslationKeys[item])}
            </Text>
          </Pressable>
        ))}
      </View>
      <SwipeableTabView
        currentIndex={currentIndex}
        onIndexChange={setCurrentIndex}
        isRTL={isRTL}
      >
        <CalendarHistory onDateSelected={onDateSelected} />
        <AllHabits />
        <Achievements />
      </SwipeableTabView>
    </ScreenContainer>
  );
}
