import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Ban,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Minus,
  MoreVertical,
  Palette,
  Plus,
  Repeat2,
  Target,
  Trash2,
  Archive,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { AppInput } from '../../components/common/AppInput';
import { ReminderTimeModal } from '../../components/common/ReminderTimeModal';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import {
  DEFAULT_HABIT_COLOR,
  HABIT_COLORS,
  normalizeHabitColor,
} from '../../constants/habitColors';
import { DEFAULT_HABIT_ICON_ID, HABIT_ICONS } from '../../constants/habitIcons';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation, type TranslationKey } from '../../localization';
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
import {
  addDays,
  formatShortDate,
  fromDateKey,
  toDateKey,
} from '../../utils/dates';
import {
  normalizeGoalMode,
  normalizeHabitType,
  normalizeScheduleMode,
  normalizeWeekdays,
} from '../../utils/habitSchedule';
import { formatLocalTime } from '../../utils/time';
import useStyles from './TodayScreenStyle';

type Props = NativeStackScreenProps<TodayStackParamList, 'CreateHabit'>;

const timeOptions: { value: TimeOfDay; labelKey: TranslationKey }[] = [
  { value: 'ANYTIME', labelKey: 'habit_time_anytime' },
  { value: 'MORNING', labelKey: 'habit_time_morning' },
  { value: 'AFTERNOON', labelKey: 'habit_time_afternoon' },
  { value: 'EVENING', labelKey: 'habit_time_evening' },
];

const habitTypes: {
  value: HabitType;
  labelKey: TranslationKey;
  icon: typeof Repeat2;
  descriptionKey: TranslationKey;
}[] = [
  {
    value: 'REGULAR',
    labelKey: 'habit_type_regular',
    icon: Repeat2,
    descriptionKey: 'habit_type_regular_description',
  },
  {
    value: 'NEGATIVE',
    labelKey: 'habit_type_negative',
    icon: Ban,
    descriptionKey: 'habit_type_negative_description',
  },
  {
    value: 'ONE_TIME',
    labelKey: 'habit_type_one_time',
    icon: ListTodo,
    descriptionKey: 'habit_type_one_time_description',
  },
];

const scheduleLabelKeys: Record<HabitScheduleMode, TranslationKey> = {
  EVERYDAY: 'habit_schedule_everyday',
  WEEKDAYS: 'habit_schedule_weekdays',
  SPECIFIC_DAYS: 'habit_schedule_specific',
  WEEKLY_QUOTA: 'habit_schedule_weekly',
  MONTHLY_QUOTA: 'habit_schedule_monthly',
  YEARLY_QUOTA: 'habit_schedule_yearly',
  ONE_TIME: 'habit_schedule_one_time',
};

const scheduleModes: HabitScheduleMode[] = [
  'EVERYDAY',
  'WEEKDAYS',
  'SPECIFIC_DAYS',
  'WEEKLY_QUOTA',
  'MONTHLY_QUOTA',
  'YEARLY_QUOTA',
];
const goalModeLabelKeys: Record<HabitGoalMode, TranslationKey> = {
  OFF: 'habit_goal_off',
  DURATION: 'habit_goal_duration',
  REPEAT: 'habit_goal_repeat',
};
const weekdayLabelKeys: TranslationKey[] = [
  'weekday_sun',
  'weekday_mon',
  'weekday_tue',
  'weekday_wed',
  'weekday_thu',
  'weekday_fri',
  'weekday_sat',
];
const weekdayAccessibilityKeys: TranslationKey[] = [
  'weekday_sunday',
  'weekday_monday',
  'weekday_tuesday',
  'weekday_wednesday',
  'weekday_thursday',
  'weekday_friday',
  'weekday_saturday',
];
const iconLabelKeys: Record<string, TranslationKey> = {
  Droplets: 'habit_icon_water',
  Footprints: 'habit_icon_walking',
  BookOpen: 'habit_icon_reading',
  Brain: 'habit_icon_meditation',
  Moon: 'habit_icon_night',
  Dumbbell: 'habit_icon_exercise',
  Pill: 'habit_icon_medicine',
  AlarmClock: 'habit_icon_alarm',
  Utensils: 'habit_icon_food',
  BedDouble: 'habit_icon_sleep',
  Activity: 'habit_icon_running',
  BicepsFlexed: 'habit_icon_gym',
  HeartPulse: 'habit_icon_health',
  GraduationCap: 'habit_icon_study',
  BriefcaseBusiness: 'habit_icon_work',
  SprayCan: 'habit_icon_cleaning',
  NotebookPen: 'habit_icon_journaling',
};
const colorLabelKeys: Record<string, TranslationKey> = {
  blue: 'habit_color_blue',
  green: 'habit_color_green',
  amber: 'habit_color_amber',
  indigo: 'habit_color_indigo',
  red: 'habit_color_red',
  sky: 'habit_color_sky',
  coral: 'habit_color_coral',
  teal: 'habit_color_teal',
};

function backgroundColorStyle(backgroundColor: string): ViewStyle {
  return { backgroundColor };
}

type ScheduleDraft = {
  mode: HabitScheduleMode;
  weekdays: number[];
  quota: number;
};

function BottomSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.createSheetBackdrop}>
        <Pressable
          accessibilityLabel={t('habit_close_sheet', { title })}
          style={styles.createSheetDismiss}
          onPress={onClose}
        />
        <View accessibilityViewIsModal style={styles.createSheet}>
          <View style={styles.sheetHandle} />
          <View style={[styles.createSheetHeader, isRTL && styles.rowRTL]}>
            <Text style={[styles.sheetTitle, isRTL && styles.textRTL]}>
              {title}
            </Text>
            <Pressable
              accessibilityLabel={t('habit_close_sheet', { title })}
              onPress={onClose}
            >
              <X color={colors.textSecondary} size={22} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function ScheduleSheet({
  visible,
  value,
  onCancel,
  onSave,
}: {
  visible: boolean;
  value: ScheduleDraft;
  onCancel: () => void;
  onSave: (value: ScheduleDraft) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (visible) setDraft(value);
  }, [value, visible]);
  const maximum =
    draft.mode === 'WEEKLY_QUOTA'
      ? 6
      : draft.mode === 'MONTHLY_QUOTA'
      ? 31
      : 365;
  const requiresQuota =
    draft.mode === 'WEEKLY_QUOTA' ||
    draft.mode === 'MONTHLY_QUOTA' ||
    draft.mode === 'YEARLY_QUOTA';
  const valid = draft.mode !== 'SPECIFIC_DAYS' || draft.weekdays.length > 0;

  return (
    <BottomSheet visible={visible} title={t('habit_days')} onClose={onCancel}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.createSheetOptions}>
          {scheduleModes.map(mode => {
            const selected = draft.mode === mode;
            return (
              <Pressable
                key={mode}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setDraft(current => ({ ...current, mode }))}
                style={[
                  styles.createSheetOption,
                  isRTL && styles.rowRTL,
                  selected && styles.createSheetOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.createSheetOptionText,
                    isRTL && styles.textRTL,
                  ]}
                >
                  {t(scheduleLabelKeys[mode])}
                </Text>
                <View
                  style={[
                    styles.createRadio,
                    selected && styles.createRadioActive,
                  ]}
                >
                  {selected ? (
                    <Check color={colors.onPrimary} size={16} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        {draft.mode === 'SPECIFIC_DAYS' ? (
          <View style={[styles.weekdayPicker, isRTL && styles.rowRTL]}>
            {weekdayLabelKeys.map((labelKey, weekday) => {
              const selected = draft.weekdays.includes(weekday);
              return (
                <Pressable
                  key={`${labelKey}-${weekday}`}
                  accessibilityLabel={t(weekdayAccessibilityKeys[weekday])}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() =>
                    setDraft(current => ({
                      ...current,
                      weekdays: selected
                        ? current.weekdays.filter(
                            dayValue => dayValue !== weekday,
                          )
                        : normalizeWeekdays([...current.weekdays, weekday]),
                    }))
                  }
                  style={[
                    styles.weekdayButton,
                    selected && styles.weekdayButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekdayButtonText,
                      isRTL && styles.centeredTextRTL,
                      selected && styles.accentActiveText,
                    ]}
                  >
                    {t(labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {requiresQuota ? (
          <View style={[styles.quotaPicker, isRTL && styles.rowRTL]}>
            <Pressable
              accessibilityLabel={t('habit_decrease_target')}
              disabled={draft.quota <= 1}
              onPress={() =>
                setDraft(current => ({
                  ...current,
                  quota: Math.max(1, current.quota - 1),
                }))
              }
              style={styles.quotaButton}
            >
              <Minus color={colors.text} size={22} />
            </Pressable>
            <View style={styles.quotaValueGroup}>
              <Text style={styles.quotaValue}>{draft.quota}</Text>
              <Text
                style={[styles.quotaCaption, isRTL && styles.centeredTextRTL]}
              >
                {draft.mode === 'WEEKLY_QUOTA'
                  ? t('habit_days_per_week')
                  : draft.mode === 'MONTHLY_QUOTA'
                  ? t('habit_days_per_month')
                  : t('habit_days_per_year')}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={t('habit_increase_target')}
              disabled={draft.quota >= maximum}
              onPress={() =>
                setDraft(current => ({
                  ...current,
                  quota: Math.min(maximum, current.quota + 1),
                }))
              }
              style={styles.quotaButton}
            >
              <Plus color={colors.text} size={22} />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
      {!valid ? (
        <Text style={[styles.formError, isRTL && styles.textRTL]}>
          {t('habit_select_weekday_error')}
        </Text>
      ) : null}
      <View style={[styles.createSheetActions, isRTL && styles.rowRTL]}>
        <AppButton
          title={t('common_cancel')}
          variant="secondary"
          onPress={onCancel}
          style={styles.createSheetAction}
        />
        <AppButton
          title={t('common_save')}
          disabled={!valid}
          onPress={() => onSave(draft)}
          style={styles.createSheetAction}
        />
      </View>
    </BottomSheet>
  );
}

function DateSheet({
  visible,
  title,
  value,
  allowOff,
  onCancel,
  onSave,
}: {
  visible: boolean;
  title: string;
  value?: string;
  allowOff?: boolean;
  onCancel: () => void;
  onSave: (value?: string) => void;
}) {
  const styles = useStyles();
  const { isRTL, locale, t } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const dates = useMemo(() => {
    const upcoming = Array.from({ length: 366 }, (_, index) =>
      addDays(today, index),
    );
    if (value && value < toDateKey(today)) {
      return [fromDateKey(value), ...upcoming];
    }
    return upcoming;
  }, [today, value]);
  const [draft, setDraft] = useState<string | undefined>(value);
  useEffect(() => {
    if (visible) setDraft(value);
  }, [value, visible]);
  return (
    <BottomSheet visible={visible} title={title} onClose={onCancel}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={isRTL ? styles.horizontalMirror : undefined}
        contentContainerStyle={styles.datePickerRow}
      >
        {allowOff ? (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: draft === undefined }}
            onPress={() => setDraft(undefined)}
            style={[
              styles.datePickerOption,
              isRTL && styles.horizontalUnmirror,
              draft === undefined && styles.datePickerOptionActive,
            ]}
          >
            <Text
              style={[styles.datePickerDay, isRTL && styles.centeredTextRTL]}
            >
              {t('habit_goal_off')}
            </Text>
            <Text
              style={[styles.datePickerDate, isRTL && styles.centeredTextRTL]}
            >
              {t('habit_no_end')}
            </Text>
          </Pressable>
        ) : null}
        {dates.map(date => {
          const dateKey = toDateKey(date);
          const selected = draft === dateKey;
          return (
            <Pressable
              key={dateKey}
              accessibilityLabel={date.toLocaleDateString(locale, {
                dateStyle: 'full',
              })}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setDraft(dateKey)}
              style={[
                styles.datePickerOption,
                isRTL && styles.horizontalUnmirror,
                selected && styles.datePickerOptionActive,
              ]}
            >
              <Text
                style={[styles.datePickerDay, isRTL && styles.centeredTextRTL]}
              >
                {date.toLocaleDateString(locale, { weekday: 'short' })}
              </Text>
              <Text
                style={[styles.datePickerDate, isRTL && styles.centeredTextRTL]}
              >
                {formatShortDate(date, locale)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
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

export function CreateHabitScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { isRTL, locale, t } = useTranslation();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const habits = useAppStore(state => state.habits);
  const add = useAppStore(state => state.addHabit);
  const update = useAppStore(state => state.updateHabit);
  const remove = useAppStore(state => state.deleteHabit);
  const setArchived = useAppStore(state => state.setHabitArchived);
  const existing = habits.find(habit => habit.id === route.params?.habitId);
  const initialType = normalizeHabitType(existing?.habitType);
  const [habitType, setHabitType] = useState<HabitType>(initialType);
  const [editingDetails, setEditingDetails] = useState(Boolean(existing));
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
  const [reminderTime, setReminderTime] = useState(
    () => existing?.reminderTime ?? reminderSettingsStorage.getWakeUpDefault(),
  );
  const [advancedVisible, setAdvancedVisible] = useState(
    Boolean(existing?.reminderEnabled || existing?.endDate),
  );
  const [iconSheetVisible, setIconSheetVisible] = useState(false);
  const [colorSheetVisible, setColorSheetVisible] = useState(false);
  const [iconDraft, setIconDraft] = useState(iconName);
  const [colorDraft, setColorDraft] = useState(color);
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

  const chooseType = (value: HabitType) => {
    setHabitType(value);
    setScheduleMode(value === 'ONE_TIME' ? 'ONE_TIME' : 'EVERYDAY');
    setSelectedWeekdays([]);
    setQuotaCount(3);
    setGoalMode('OFF');
    setGoalTarget(10);
    setMotivationalText('');
    setEndDate(undefined);
    setTargetDate(toDateKey(new Date()));
  };

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
      reminderEnabled: reminder,
      reminderTime,
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
      <ScreenContainer scroll style={styles.createTypeScreen}>
        <AppHeader
          title={t('habit_create_title')}
          onBack={navigation.goBack}
          isRTL={isRTL}
        />
        <View style={[styles.habitTypeRow, isRTL && styles.rowRTL]}>
          {habitTypes.map(({ value, labelKey, icon: Icon }) => {
            const selected = value === habitType;
            return (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={t(labelKey).replace('\n', ' ')}
                onPress={() => chooseType(value)}
                style={[
                  styles.habitTypeCard,
                  selected && styles.habitTypeCardActive,
                  selected && value === 'NEGATIVE' && styles.habitTypeNegative,
                ]}
              >
                <Icon
                  color={selected ? colors.onPrimary : colors.textSecondary}
                  size={31}
                />
                <Text
                  style={[
                    styles.habitTypeLabel,
                    isRTL && styles.centeredTextRTL,
                    selected && styles.accentActiveText,
                  ]}
                >
                  {t(labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.habitTypeDescription}>
          <Text
            style={[styles.habitTypeDescriptionTitle, isRTL && styles.textRTL]}
          >
            {t(typeDefinition.labelKey).replace('\n', ' ')}
          </Text>
          <Text
            style={[styles.habitTypeDescriptionText, isRTL && styles.textRTL]}
          >
            {t(typeDefinition.descriptionKey)}
          </Text>
        </View>
        <AppButton
          title={t('habit_create_own')}
          onPress={() => setEditingDetails(true)}
          style={styles.createOwnButton}
        />
      </ScreenContainer>
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
            setIconDraft(iconName);
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
            setColorDraft(color);
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
              onValueChange={setReminder}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={colors.onPrimary}
            />
          </View>
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
      <Modal
        transparent
        visible={Boolean(existing && actionsVisible)}
        animationType="fade"
        onRequestClose={() => setActionsVisible(false)}
      >
        <Pressable
          accessibilityLabel={t('habit_close_actions')}
          style={styles.editActionsBackdrop}
          onPress={() => setActionsVisible(false)}
        >
          <Pressable
            style={[
              styles.editActionsMenu,
              isRTL && styles.editActionsMenuRTL,
              { top: insets.top + 52 },
            ]}
            onPress={event => event.stopPropagation()}
          >
            <Pressable
              accessibilityLabel={t('habit_archive_accessibility')}
              accessibilityRole="button"
              onPress={archiveExistingHabit}
              style={[styles.editActionItem, isRTL && styles.rowRTL]}
            >
              <Archive color={colors.textSecondary} size={19} />
              <Text style={[styles.editActionText, isRTL && styles.textRTL]}>
                {t('habit_archive_action')}
              </Text>
            </Pressable>
            <View style={styles.editActionDivider} />
            <Pressable
              accessibilityLabel={t('habit_delete_accessibility')}
              accessibilityRole="button"
              onPress={deleteExistingHabit}
              style={[styles.editActionItem, isRTL && styles.rowRTL]}
            >
              <Trash2 color={colors.red} size={19} />
              <Text
                style={[styles.editActionDangerText, isRTL && styles.textRTL]}
              >
                {t('common_delete')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <BottomSheet
        visible={iconSheetVisible}
        title={t('habit_icon_picker_title')}
        onClose={() => setIconSheetVisible(false)}
      >
        <View style={[styles.iconPickerGrid, isRTL && styles.wrapRowRTL]}>
          {HABIT_ICONS.map(({ id, icon: Icon }) => {
            const selected = iconDraft === id;
            return (
              <Pressable
                key={id}
                accessibilityLabel={t('habit_icon_accessibility', {
                  label: t(iconLabelKeys[id] ?? 'habit_icon'),
                })}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setIconDraft(id)}
                style={[
                  styles.iconPickerOption,
                  selected && styles.iconPickerOptionActive,
                ]}
              >
                <Icon
                  color={selected ? colors.onPrimary : colors.textSecondary}
                  size={25}
                />
              </Pressable>
            );
          })}
        </View>
        <View style={[styles.createSheetActions, isRTL && styles.rowRTL]}>
          <AppButton
            title={t('common_cancel')}
            variant="secondary"
            onPress={() => setIconSheetVisible(false)}
            style={styles.createSheetAction}
          />
          <AppButton
            title={t('common_save')}
            onPress={() => {
              setIconName(iconDraft);
              setIconSheetVisible(false);
            }}
            style={styles.createSheetAction}
          />
        </View>
      </BottomSheet>
      <BottomSheet
        visible={colorSheetVisible}
        title={t('habit_color_picker_title')}
        onClose={() => setColorSheetVisible(false)}
      >
        <View style={[styles.colorPickerGrid, isRTL && styles.wrapRowRTL]}>
          {HABIT_COLORS.map(option => {
            const selected = colorDraft === option.value;
            return (
              <Pressable
                key={option.id}
                accessibilityLabel={t('habit_color_accessibility', {
                  label: t(colorLabelKeys[option.id] ?? 'habit_color'),
                })}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setColorDraft(option.value)}
                style={[
                  styles.colorPickerOption,
                  backgroundColorStyle(option.value),
                  selected && styles.colorPickerOptionActive,
                ]}
              >
                {selected ? <Check color={colors.onPrimary} size={24} /> : null}
              </Pressable>
            );
          })}
        </View>
        <View style={[styles.createSheetActions, isRTL && styles.rowRTL]}>
          <AppButton
            title={t('common_cancel')}
            variant="secondary"
            onPress={() => setColorSheetVisible(false)}
            style={styles.createSheetAction}
          />
          <AppButton
            title={t('common_save')}
            onPress={() => {
              setColor(colorDraft);
              setColorSheetVisible(false);
            }}
            style={styles.createSheetAction}
          />
        </View>
      </BottomSheet>
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
    </ScreenContainer>
  );
}
