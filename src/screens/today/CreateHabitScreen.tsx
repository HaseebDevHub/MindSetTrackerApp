import React, { useCallback, useRef, useState, useTransition } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  MoreVertical,
  Palette,
  Plus,
  Target,
} from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { AppInput } from '../../components/common/AppInput';
import { ReminderTimeModal } from '../../components/common/ReminderTimeModal';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import {
  DEFAULT_HABIT_COLOR,
  normalizeHabitColor,
} from '../../constants/habitColors';
import { DEFAULT_HABIT_ICON_ID, HABIT_ICONS } from '../../constants/habitIcons';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../localization';
import { reminderSettingsStorage } from '../../storage/reminderSettingsStorage';
import { useAppStore } from '../../store/useAppStore';
import type {
  HabitGoalMode,
  HabitFrequency,
  HabitScheduleMode,
  HabitType,
  TimeOfDay,
  TodayStackParamList,
} from '../../types/models';
import { formatShortDate, fromDateKey, toDateKey } from '../../utils/dates';
import {
  normalizeGoalMode,
  normalizeHabitType,
  normalizeScheduleMode,
  normalizeWeekdays,
} from '../../utils/habitSchedule';
import { canEnableHabitReminder } from '../../utils/notifications';
import { formatLocalTime } from '../../utils/time';
import useStyles from './TodayScreenStyle';
import { HabitAlertTypeSelector } from './components/HabitAlertTypeSelector';
import { normalizeHabitAlertType } from '../../utils/habitSchedule';
import { HabitTypeSelection } from './components/createHabit/HabitTypeSelection';
import { DateSheet } from './components/createHabit/DateSheet';
import { ScheduleSheet } from './components/createHabit/ScheduleSheet';
import { IconSheet } from './components/createHabit/IconSheet';
import { ColorSheet } from './components/createHabit/ColorSheet';
import { HabitActionsMenu } from './components/createHabit/HabitActionsMenu';
import {
  backgroundColorStyle,
  habitTypes,
  timeOptions,
  goalModeLabelKeys,
  scheduleLabelKeys,
  weekdayLabelKeys,
} from './components/createHabit/createHabitOptions';

type Props = NativeStackScreenProps<TodayStackParamList, 'CreateHabit'>;

export function CreateHabitScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { isRTL, locale, t } = useTranslation();
  const styles = useStyles();
  const habits = useAppStore(state => state.habits);
  const add = useAppStore(state => state.addHabit);
  const update = useAppStore(state => state.updateHabit);
  const remove = useAppStore(state => state.deleteHabit);
  const setArchived = useAppStore(state => state.setHabitArchived);
  const existing = habits.find(habit => habit.id === route.params?.habitId);
  const initialType = normalizeHabitType(existing?.habitType);
  const [habitType, setHabitType] = useState<HabitType>(initialType);
  const [editingDetails, setEditingDetails] = useState(Boolean(existing));
  const [isOpeningDetails, startOpeningDetails] = useTransition();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [iconName, setIconName] = useState(
    existing?.iconName ?? DEFAULT_HABIT_ICON_ID,
  );
  const [color, setColor] = useState(
    normalizeHabitColor(existing?.color ?? DEFAULT_HABIT_COLOR),
  );
  const [time, setTime] = useState<TimeOfDay>(existing?.timeOfDay ?? 'ANYTIME');
  const [scheduleMode, setScheduleMode] = useState<HabitScheduleMode>(
    existing
      ? normalizeScheduleMode(existing.scheduleMode, existing.frequency)
      : 'EVERYDAY',
  );
  const [selectedWeekdays, setSelectedWeekdays] = useState(
    normalizeWeekdays(existing?.selectedWeekdays),
  );
  const [quotaCount, setQuotaCount] = useState(existing?.quotaCount ?? 3);
  const [targetDate, setTargetDate] = useState(
    existing?.targetDate ?? toDateKey(new Date()),
  );
  const [endDate, setEndDate] = useState(existing?.endDate);
  const [goalMode, setGoalMode] = useState<HabitGoalMode>(
    normalizeGoalMode(existing?.goalMode),
  );
  const [goalTarget, setGoalTarget] = useState(existing?.goalTarget ?? 10);
  const [motivationalText, setMotivationalText] = useState(
    existing?.motivationalText ?? '',
  );
  const [reminder, setReminder] = useState(existing?.reminderEnabled ?? false);
  const [reminderType, setReminderType] = useState(() =>
    normalizeHabitAlertType(existing?.reminderType),
  );
  const [reminderTime, setReminderTime] = useState(
    () => existing?.reminderTime ?? reminderSettingsStorage.getWakeUpDefault(),
  );
  const [advancedVisible, setAdvancedVisible] = useState(
    Boolean(existing?.reminderEnabled || existing?.endDate),
  );
  const [iconSheetVisible, setIconSheetVisible] = useState(false);
  const [colorSheetVisible, setColorSheetVisible] = useState(false);
  const [scheduleSheetVisible, setScheduleSheetVisible] = useState(false);
  const [targetDateSheetVisible, setTargetDateSheetVisible] = useState(false);
  const [endDateSheetVisible, setEndDateSheetVisible] = useState(false);
  const [timeEditorVisible, setTimeEditorVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [isLifecycleSaving, setIsLifecycleSaving] = useState(false);
  const savingRef = useRef(false);
  const typeDefinition = habitTypes.find(item => item.value === habitType)!;
  const SelectedIcon = HABIT_ICONS.find(item => item.id === iconName)?.icon;
  const DirectionalChevron = isRTL ? ChevronLeft : ChevronRight;
  const scheduleSummary =
    scheduleMode === 'SPECIFIC_DAYS'
      ? selectedWeekdays.map(day => t(weekdayLabelKeys[day])).join(' ')
      : scheduleMode === 'WEEKLY_QUOTA' ||
        scheduleMode === 'MONTHLY_QUOTA' ||
        scheduleMode === 'YEARLY_QUOTA'
      ? `${quotaCount} ${t(scheduleLabelKeys[scheduleMode]).toLowerCase()}`
      : t(scheduleLabelKeys[scheduleMode]);

  const showReminderLimit = () =>
    Alert.alert(t('notification_limit_title'), t('notification_limit_message'));

  const changeReminderEnabled = (enabled: boolean) => {
    if (enabled && !canEnableHabitReminder(habits, existing?.id)) {
      setReminder(false);
      showReminderLimit();
      return;
    }
    setReminder(enabled);
  };

  const continueWithType = useCallback(
    (value: HabitType) => {
      startOpeningDetails(() => {
        if (value !== habitType) {
          setHabitType(value);
          setScheduleMode(value === 'ONE_TIME' ? 'ONE_TIME' : 'EVERYDAY');
          setSelectedWeekdays([]);
          setQuotaCount(3);
          setGoalMode('OFF');
          setGoalTarget(10);
          setMotivationalText('');
          setEndDate(undefined);
          setTargetDate(toDateKey(new Date()));
        }
        setEditingDetails(true);
      });
    },
    [habitType],
  );

  const save = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || savingRef.current) return;
    if (scheduleMode === 'SPECIFIC_DAYS' && !selectedWeekdays.length) {
      Alert.alert(
        t('habit_choose_days_error'),
        t('habit_select_weekday_error'),
      );
      return;
    }
    const reminderAllowed =
      !reminder || canEnableHabitReminder(habits, existing?.id);
    if (!reminderAllowed) {
      setReminder(false);
      showReminderLimit();
    }
    savingRef.current = true;
    setIsSaving(true);
    const frequency: HabitFrequency =
      scheduleMode === 'WEEKDAYS' ? 'WEEKDAYS' : 'EVERYDAY';
    const values = {
      title: trimmedTitle,
      iconName,
      color,
      habitType,
      timeOfDay: time,
      frequency,
      scheduleMode: habitType === 'ONE_TIME' ? 'ONE_TIME' : scheduleMode,
      selectedWeekdays:
        scheduleMode === 'SPECIFIC_DAYS' ? selectedWeekdays : undefined,
      quotaCount:
        scheduleMode === 'WEEKLY_QUOTA' ||
        scheduleMode === 'MONTHLY_QUOTA' ||
        scheduleMode === 'YEARLY_QUOTA'
          ? quotaCount
          : undefined,
      targetDate: habitType === 'ONE_TIME' ? targetDate : undefined,
      endDate: habitType === 'ONE_TIME' ? undefined : endDate,
      goalMode: habitType === 'REGULAR' ? goalMode : 'OFF',
      goalTarget:
        habitType === 'REGULAR' && goalMode !== 'OFF' ? goalTarget : undefined,
      goalUnit:
        habitType === 'REGULAR' && goalMode === 'DURATION'
          ? ('MINUTES' as const)
          : habitType === 'REGULAR' && goalMode === 'REPEAT'
          ? ('REPS' as const)
          : undefined,
      motivationalText:
        habitType === 'NEGATIVE' && motivationalText.trim()
          ? motivationalText.trim()
          : undefined,
      reminderEnabled: reminderAllowed && reminder,
      reminderTime,
      reminderType,
    };
    const saved = existing
      ? await update(existing.id, values)
      : await add(values);
    savingRef.current = false;
    setIsSaving(false);
    if (saved) {
      if (existing) navigation.goBack();
      else {
        navigation.popTo('TodayHome', {
          toastMessage: t('habit_created_successfully'),
          toastRequestId: Date.now(),
        });
      }
    } else {
      Alert.alert(t('habit_save_error'), t('habit_save_error_message'));
    }
  };

  const deleteExistingHabit = () => {
    if (!existing || isLifecycleSaving) return;
    setActionsVisible(false);
    Alert.alert(
      t('habit_delete_title'),
      t('habit_delete_message', { title: existing.title }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('common_delete'),
          style: 'destructive',
          onPress: () => {
            setIsLifecycleSaving(true);
            remove(existing.id)
              .then(deleted => {
                if (!deleted) {
                  Alert.alert(
                    t('habit_delete_error'),
                    t('habit_delete_error_message'),
                  );
                  return;
                }
                navigation.goBack();
              })
              .catch(() => {
                Alert.alert(
                  t('habit_delete_error'),
                  t('habit_delete_error_message'),
                );
              })
              .finally(() => setIsLifecycleSaving(false));
          },
        },
      ],
    );
  };

  const archiveExistingHabit = () => {
    if (!existing || isLifecycleSaving) return;
    setActionsVisible(false);
    Alert.alert(
      t('habit_archive_title'),
      t('habit_archive_message', { title: existing.title }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('habit_archive_action'),
          onPress: () => {
            setIsLifecycleSaving(true);
            setArchived(existing.id, true)
              .then(archived => {
                if (!archived) {
                  Alert.alert(
                    t('habit_archive_error'),
                    t('habit_archive_error_message'),
                  );
                  return;
                }
                navigation.goBack();
              })
              .catch(() => {
                Alert.alert(
                  t('habit_archive_error'),
                  t('habit_archive_error_message'),
                );
              })
              .finally(() => setIsLifecycleSaving(false));
          },
        },
      ],
    );
  };

  if (!editingDetails) {
    return (
      <HabitTypeSelection
        initialType={habitType}
        loading={isOpeningDetails}
        onBack={navigation.goBack}
        onContinue={continueWithType}
      />
    );
  }

  return (
    <ScreenContainer scroll keyboard style={styles.form}>
      <AppHeader
        isRTL={isRTL}
        title={
          existing
            ? t('habit_edit_title')
            : t('habit_type_title', {
                type: t(typeDefinition.labelKey).replace('\n', ' '),
              })
        }
        onBack={() =>
          existing ? navigation.goBack() : setEditingDetails(false)
        }
        right={
          existing ? (
            <Pressable
              accessibilityLabel={t('habit_open_actions')}
              accessibilityRole="button"
              disabled={isLifecycleSaving}
              hitSlop={10}
              onPress={() => setActionsVisible(true)}
              style={styles.editActionsButton}
            >
              <MoreVertical color={colors.text} size={24} />
            </Pressable>
          ) : undefined
        }
      />
      <AppInput
        isRTL={isRTL}
        label={t('habit_name')}
        autoFocus={!existing}
        value={title}
        onChangeText={setTitle}
        placeholder={
          habitType === 'NEGATIVE'
            ? t('habit_name_negative_placeholder')
            : habitType === 'ONE_TIME'
            ? t('habit_name_one_time_placeholder')
            : t('habit_name_regular_placeholder')
        }
        maxLength={80}
      />
      <View style={styles.appearanceCard}>
        <Pressable
          accessibilityLabel={t('habit_choose_icon')}
          onPress={() => {
            setIconSheetVisible(true);
          }}
          style={[styles.appearanceRow, isRTL && styles.rowRTL]}
        >
          <View style={[styles.appearancePreview, backgroundColorStyle(color)]}>
            {SelectedIcon ? (
              <SelectedIcon color={colors.onPrimary} size={23} />
            ) : null}
          </View>
          <Text style={[styles.appearanceLabel, isRTL && styles.textRTL]}>
            {t('habit_icon')}
          </Text>
          <DirectionalChevron color={colors.textSecondary} size={21} />
        </Pressable>
        <View
          style={[
            styles.appearanceDivider,
            isRTL && styles.appearanceDividerRTL,
          ]}
        />
        <Pressable
          accessibilityLabel={t('habit_choose_color')}
          onPress={() => {
            setColorSheetVisible(true);
          }}
          style={[styles.appearanceRow, isRTL && styles.rowRTL]}
        >
          <Palette color={colors.textSecondary} size={23} />
          <Text style={[styles.appearanceLabel, isRTL && styles.textRTL]}>
            {t('habit_color')}
          </Text>
          <View style={[styles.colorPreview, backgroundColorStyle(color)]} />
          <DirectionalChevron color={colors.textSecondary} size={21} />
        </Pressable>
      </View>
      {habitType === 'ONE_TIME' ? (
        <>
          <Text style={[styles.label, isRTL && styles.textRTL]}>
            {t('habit_when')}
          </Text>
          <Pressable
            accessibilityLabel={t('habit_choose_task_date')}
            onPress={() => setTargetDateSheetVisible(true)}
            style={[styles.formRowCard, isRTL && styles.rowRTL]}
          >
            <CalendarDays color={colors.textSecondary} size={22} />
            <Text style={[styles.formRowLabel, isRTL && styles.textRTL]}>
              {t('habit_do_it_on')}
            </Text>
            <Text style={[styles.formRowValue, isRTL && styles.textRTL]}>
              {fromDateKey(targetDate).toLocaleDateString(locale, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <DirectionalChevron color={colors.textSecondary} size={21} />
          </Pressable>
        </>
      ) : (
        <>
          <Text style={[styles.label, isRTL && styles.textRTL]}>
            {t('habit_repeat')}
          </Text>
          <Pressable
            accessibilityLabel={t('habit_edit_days')}
            onPress={() => setScheduleSheetVisible(true)}
            style={[styles.formRowCard, isRTL && styles.rowRTL]}
          >
            <CalendarDays color={colors.textSecondary} size={22} />
            <Text style={[styles.formRowLabel, isRTL && styles.textRTL]}>
              {t('habit_days')}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.formRowValue, isRTL && styles.textRTL]}
            >
              {scheduleSummary}
            </Text>
            <DirectionalChevron color={colors.textSecondary} size={21} />
          </Pressable>
        </>
      )}
      <Text style={[styles.label, isRTL && styles.textRTL]}>
        {t('habit_do_it_at')}
      </Text>
      <View style={[styles.createTimeGrid, isRTL && styles.wrapRowRTL]}>
        {timeOptions.map(option => {
          const selected = time === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setTime(option.value)}
              style={[styles.createTimeOption, selected && styles.timeActive]}
            >
              <Text
                style={[
                  styles.createTimeText,
                  isRTL && styles.centeredTextRTL,
                  selected && styles.accentActiveText,
                ]}
              >
                {t(option.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {habitType === 'REGULAR' ? (
        <>
          <Text style={[styles.label, isRTL && styles.textRTL]}>
            {t('habit_daily_goal')}
          </Text>
          <View style={[styles.goalModeRow, isRTL && styles.rowRTL]}>
            {(['OFF', 'DURATION', 'REPEAT'] as HabitGoalMode[]).map(mode => {
              const selected = goalMode === mode;
              return (
                <Pressable
                  key={mode}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setGoalMode(mode)}
                  style={[styles.goalModeButton, selected && styles.timeActive]}
                >
                  <Text
                    style={[
                      styles.timeText,
                      isRTL && styles.centeredTextRTL,
                      selected && styles.accentActiveText,
                    ]}
                  >
                    {t(goalModeLabelKeys[mode])}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {goalMode !== 'OFF' ? (
            <View style={[styles.goalTargetCard, isRTL && styles.rowRTL]}>
              <Target color={colors.primary} size={22} />
              <Text style={[styles.formRowLabel, isRTL && styles.textRTL]}>
                {t('habit_target')}
              </Text>
              <Pressable
                accessibilityLabel={t('habit_decrease_goal')}
                onPress={() => setGoalTarget(value => Math.max(1, value - 1))}
                style={styles.smallStepButton}
              >
                <Minus color={colors.text} size={18} />
              </Pressable>
              <Text style={styles.goalTargetValue}>
                {t(
                  goalMode === 'DURATION'
                    ? 'habit_goal_value_minutes'
                    : 'habit_goal_value_reps',
                  { value: goalTarget },
                )}
              </Text>
              <Pressable
                accessibilityLabel={t('habit_increase_goal')}
                onPress={() => setGoalTarget(value => Math.min(999, value + 1))}
                style={styles.smallStepButton}
              >
                <Plus color={colors.text} size={18} />
              </Pressable>
            </View>
          ) : null}
        </>
      ) : null}
      {habitType === 'NEGATIVE' ? (
        <AppInput
          isRTL={isRTL}
          label={t('habit_motivation')}
          value={motivationalText}
          onChangeText={setMotivationalText}
          placeholder={t('habit_motivation_placeholder')}
          maxLength={160}
          multiline
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: advancedVisible }}
        onPress={() => setAdvancedVisible(value => !value)}
        style={[styles.advancedHeader, isRTL && styles.rowRTL]}
      >
        <Text style={[styles.advancedTitle, isRTL && styles.textRTL]}>
          {t('habit_advanced')}
        </Text>
        <ChevronDown
          color={colors.textSecondary}
          size={22}
          style={advancedVisible ? styles.advancedChevronOpen : undefined}
        />
      </Pressable>
      {advancedVisible ? (
        <View style={styles.advancedContent}>
          <Text style={[styles.label, isRTL && styles.textRTL]}>
            {t('habit_reminder')}
          </Text>
          <View style={[styles.reminder, isRTL && styles.rowRTL]}>
            <Pressable
              accessibilityLabel={t('habit_edit_reminder_time', {
                time: formatLocalTime(reminderTime, locale),
              })}
              onPress={() => setTimeEditorVisible(true)}
              style={[styles.reminderBody, isRTL && styles.rowRTL]}
            >
              <View style={styles.reminderIcon}>
                <Bell color={colors.primary} size={21} />
              </View>
              <View style={styles.reminderCopy}>
                <Text style={[styles.reminderTitle, isRTL && styles.textRTL]}>
                  {t('habit_reminder_title')}
                </Text>
                <Text style={[styles.reminderHint, isRTL && styles.textRTL]}>
                  {t('habit_reminder_hint', {
                    time: formatLocalTime(reminderTime, locale),
                  })}
                </Text>
              </View>
            </Pressable>
            <Switch
              accessibilityLabel={t('habit_enable_reminder')}
              value={reminder}
              onValueChange={changeReminderEnabled}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={colors.onPrimary}
            />
          </View>
          {reminder && (
            <HabitAlertTypeSelector
              value={reminderType}
              onChange={setReminderType}
            />
          )}
          {habitType !== 'ONE_TIME' ? (
            <>
              <Text style={[styles.label, isRTL && styles.textRTL]}>
                {t('habit_end_on_section')}
              </Text>
              <Pressable
                accessibilityLabel={t('habit_choose_end_date')}
                onPress={() => setEndDateSheetVisible(true)}
                style={[styles.formRowCard, isRTL && styles.rowRTL]}
              >
                <CalendarDays color={colors.textSecondary} size={22} />
                <Text style={[styles.formRowLabel, isRTL && styles.textRTL]}>
                  {t('habit_end_date')}
                </Text>
                <Text style={[styles.formRowValue, isRTL && styles.textRTL]}>
                  {endDate
                    ? formatShortDate(fromDateKey(endDate), locale)
                    : t('habit_off')}
                </Text>
                <DirectionalChevron color={colors.textSecondary} size={21} />
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}
      <AppButton
        title={existing ? t('habit_save_changes') : t('common_save')}
        disabled={!title.trim()}
        loading={isSaving}
        onPress={() => save().catch(() => undefined)}
        style={styles.save}
      />
      {existing && actionsVisible && (
        <HabitActionsMenu
          onClose={() => setActionsVisible(false)}
          onArchive={archiveExistingHabit}
          onDelete={deleteExistingHabit}
        />
      )}
      {iconSheetVisible && (
        <IconSheet
          value={iconName}
          onCancel={() => setIconSheetVisible(false)}
          onSave={value => {
            setIconName(value);
            setIconSheetVisible(false);
          }}
        />
      )}
      {colorSheetVisible && (
        <ColorSheet
          value={color}
          onCancel={() => setColorSheetVisible(false)}
          onSave={value => {
            setColor(value);
            setColorSheetVisible(false);
          }}
        />
      )}
      {scheduleSheetVisible && (
        <ScheduleSheet
          visible={scheduleSheetVisible}
          value={{
            mode: scheduleMode === 'ONE_TIME' ? 'EVERYDAY' : scheduleMode,
            weekdays: selectedWeekdays,
            quota: quotaCount,
          }}
          onCancel={() => setScheduleSheetVisible(false)}
          onSave={value => {
            setScheduleMode(value.mode);
            setSelectedWeekdays(value.weekdays);
            setQuotaCount(value.quota);
            setScheduleSheetVisible(false);
          }}
        />
      )}
      {targetDateSheetVisible && (
        <DateSheet
          visible={targetDateSheetVisible}
          title={t('habit_do_it_on')}
          value={targetDate}
          onCancel={() => setTargetDateSheetVisible(false)}
          onSave={value => {
            if (value) setTargetDate(value);
            setTargetDateSheetVisible(false);
          }}
        />
      )}
      {endDateSheetVisible && (
        <DateSheet
          visible={endDateSheetVisible}
          title={t('habit_end_on_section')}
          value={endDate}
          allowOff
          onCancel={() => setEndDateSheetVisible(false)}
          onSave={value => {
            setEndDate(value);
            setEndDateSheetVisible(false);
          }}
        />
      )}
      {timeEditorVisible && (
        <ReminderTimeModal
          isRTL={isRTL}
          visible={timeEditorVisible}
          title={t('habit_set_reminder')}
          value={reminderTime}
          onCancel={() => setTimeEditorVisible(false)}
          onSave={value => {
            setReminderTime(value);
            setTimeEditorVisible(false);
          }}
        />
      )}
    </ScreenContainer>
  );
}
