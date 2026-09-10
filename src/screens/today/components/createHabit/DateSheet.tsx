import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { AppButton } from '../../../../components/common/AppButton';
import { spacing } from '../../../../constants/theme';
import { useTranslation } from '../../../../localization';
import { addDays, fromDateKey, toDateKey } from '../../../../utils/dates';
import useStyles from '../../TodayScreenStyle';
import { BottomSheet } from './BottomSheet';

type Props = {
  visible: boolean;
  title: string;
  value?: string;
  allowOff?: boolean;
  onCancel: () => void;
  onSave: (value?: string) => void;
};

// Matches the existing 96pt date card plus the row gap.
const DATE_STRIDE = 96 + spacing.small;
const getItemLayout = (
  _: ArrayLike<Date | undefined> | null | undefined,
  index: number,
) => ({
  length: DATE_STRIDE,
  offset: index * DATE_STRIDE,
  index,
});
const keyExtractor = (date: Date | undefined) =>
  date ? toDateKey(date) : 'off';

// Mounted only while open. Drafts naturally reset when cancelled/reopened.
export function DateSheet({
  visible,
  title,
  value,
  allowOff,
  onCancel,
  onSave,
}: Props) {
  const styles = useStyles();
  const { isRTL, locale, t } = useTranslation();
  const [draft, setDraft] = useState(value);
  const [dates] = useState(() => {
    const today = new Date();
    const upcoming = Array.from({ length: 366 }, (_, index) =>
      addDays(today, index),
    );
    if (value && value < toDateKey(today)) upcoming.unshift(fromDateKey(value));
    else if (value && value > toDateKey(upcoming[upcoming.length - 1]))
      upcoming.push(fromDateKey(value));
    return allowOff ? [undefined, ...upcoming] : upcoming;
  });
  const [initialIndex] = useState(() =>
    Math.max(
      0,
      dates.findIndex(date => (date ? toDateKey(date) : undefined) === value),
    ),
  );
  // Reuse formatters; format only visible cells rather than 366 dates on each tap.
  const formatters = useMemo(
    () => ({
      full: new Intl.DateTimeFormat(locale, { dateStyle: 'full' }),
      weekday: new Intl.DateTimeFormat(locale, { weekday: 'short' }),
      short: new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
      }),
    }),
    [locale],
  );
  const renderItem = useCallback(
    ({ item: date }: { item: Date | undefined }) => {
      const dateKey = date ? toDateKey(date) : undefined;
      return (
        <Pressable
          accessibilityLabel={
            date ? formatters.full.format(date) : t('habit_no_end')
          }
          accessibilityRole="radio"
          accessibilityState={{ selected: draft === dateKey }}
          onPress={() => setDraft(dateKey)}
          style={[
            styles.datePickerOption,
            isRTL && styles.horizontalUnmirror,
            draft === dateKey && styles.datePickerOptionActive,
          ]}
        >
          <Text style={[styles.datePickerDay, isRTL && styles.centeredTextRTL]}>
            {date ? formatters.weekday.format(date) : t('habit_goal_off')}
          </Text>
          <Text
            style={[styles.datePickerDate, isRTL && styles.centeredTextRTL]}
          >
            {date ? formatters.short.format(date) : t('habit_no_end')}
          </Text>
        </Pressable>
      );
    },
    [draft, formatters, isRTL, styles, t],
  );

  return (
    <BottomSheet visible={visible} title={title} onClose={onCancel}>
      <FlatList
        horizontal
        data={dates}
        extraData={draft}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        initialScrollIndex={initialIndex}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={3}
        removeClippedSubviews={false}
        showsHorizontalScrollIndicator={false}
        style={isRTL ? styles.horizontalMirror : undefined}
        contentContainerStyle={styles.datePickerRow}
      />
      <View style={[styles.createSheetActions, isRTL && styles.rowRTL]}>
        <AppButton
          title={t('common_cancel')}
          variant="secondary"
          onPress={onCancel}
          style={styles.createSheetAction}
        />
        <AppButton
          title={t('common_save')}
          disabled={!allowOff && !draft}
          onPress={() => onSave(draft)}
          style={styles.createSheetAction}
        />
      </View>
    </BottomSheet>
  );
}
