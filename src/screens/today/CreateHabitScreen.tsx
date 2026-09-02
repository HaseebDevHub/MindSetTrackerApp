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

const timeOptions: { value: TimeOfDay; label: string }[] = [
  { value: 'ANYTIME', label: 'Anytime' },
  { value: 'MORNING', label: 'Morning' },
  { value: 'AFTERNOON', label: 'Afternoon' },
  { value: 'EVENING', label: 'Evening' },
];

const habitTypes: {
  value: HabitType;
  label: string;
  icon: typeof Repeat2;
  description: string;
}[] = [
  {
    value: 'REGULAR',
    label: 'REGULAR',
    icon: Repeat2,
    description:
      'Related to your routine. Check it in a regular and repeated way.',
  },
  {
    value: 'NEGATIVE',
    label: 'NEGATIVE',
    icon: Ban,
    description:
      'Start each active day as successful. Record only when you relapse.',
  },
  {
    value: 'ONE_TIME',
    label: 'ONE-TIME\nTODO',
    icon: ListTodo,
    description: 'Plan an important one-time task for one exact local date.',
  },
];

const scheduleLabels: Record<HabitScheduleMode, string> = {
  EVERYDAY: 'Every day',
  WEEKDAYS: 'Weekdays',
  SPECIFIC_DAYS: 'Specific days in week',
  WEEKLY_QUOTA: 'Days per week',
  MONTHLY_QUOTA: 'Days per month',
  YEARLY_QUOTA: 'Days per year',
  ONE_TIME: 'One time',
};

const scheduleModes: HabitScheduleMode[] = [
  'EVERYDAY',
  'WEEKDAYS',
  'SPECIFIC_DAYS',
  'WEEKLY_QUOTA',
  'MONTHLY_QUOTA',
  'YEARLY_QUOTA',
];
const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const weekdayAccessibilityLabels = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

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
          accessibilityLabel={`Close ${title}`}
          style={styles.createSheetDismiss}
          onPress={onClose}
        />
        <View accessibilityViewIsModal style={styles.createSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.createSheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable accessibilityLabel={`Close ${title}`} onPress={onClose}>
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
    <BottomSheet visible={visible} title="Habit days" onClose={onCancel}>
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
                  selected && styles.createSheetOptionActive,
                ]}
              >
                <Text style={styles.createSheetOptionText}>
                  {scheduleLabels[mode]}
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
          <View style={styles.weekdayPicker}>
            {weekdayLabels.map((label, weekday) => {
              const selected = draft.weekdays.includes(weekday);
              return (
                <Pressable
                  key={`${label}-${weekday}`}
                  accessibilityLabel={weekdayAccessibilityLabels[weekday]}
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
                      selected && styles.accentActiveText,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {requiresQuota ? (
          <View style={styles.quotaPicker}>
            <Pressable
              accessibilityLabel="Decrease target"
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
              <Text style={styles.quotaCaption}>
                {draft.mode === 'WEEKLY_QUOTA'
                  ? 'days per week'
                  : draft.mode === 'MONTHLY_QUOTA'
                  ? 'days per month'
                  : 'days per year'}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Increase target"
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
        <Text style={styles.formError}>Select at least one weekday.</Text>
      ) : null}
      <View style={styles.createSheetActions}>
        <AppButton
          title="CANCEL"
          variant="secondary"
          onPress={onCancel}
          style={styles.createSheetAction}
        />
        <AppButton
          title="SAVE"
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
        contentContainerStyle={styles.datePickerRow}
      >
        {allowOff ? (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: draft === undefined }}
            onPress={() => setDraft(undefined)}
            style={[
              styles.datePickerOption,
              draft === undefined && styles.datePickerOptionActive,
            ]}
          >
            <Text style={styles.datePickerDay}>OFF</Text>
            <Text style={styles.datePickerDate}>No end</Text>
          </Pressable>
        ) : null}
        {dates.map(date => {
          const dateKey = toDateKey(date);
          const selected = draft === dateKey;
          return (
            <Pressable
              key={dateKey}
              accessibilityLabel={date.toDateString()}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setDraft(dateKey)}
              style={[
                styles.datePickerOption,
                selected && styles.datePickerOptionActive,
              ]}
            >
              <Text style={styles.datePickerDay}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={styles.datePickerDate}>{formatShortDate(date)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.createSheetActions}>
        <AppButton
          title="CANCEL"
          variant="secondary"
          onPress={onCancel}
          style={styles.createSheetAction}
        />
        <AppButton
          title="SAVE"
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
  const scheduleSummary =
    scheduleMode === 'SPECIFIC_DAYS'
      ? selectedWeekdays.map(day => weekdayLabels[day]).join(' ')
      : scheduleMode === 'WEEKLY_QUOTA' ||
        scheduleMode === 'MONTHLY_QUOTA' ||
        scheduleMode === 'YEARLY_QUOTA'
      ? `${quotaCount} ${scheduleLabels[scheduleMode].toLowerCase()}`
      : scheduleLabels[scheduleMode];

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
      Alert.alert('Choose habit days', 'Select at least one weekday.');
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
          toastMessage: 'Habit created successfully',
          toastRequestId: Date.now(),
        });
      }
    } else {
      Alert.alert(
        'Unable to save habit',
        'Your habit could not be saved. Please try again.',
      );
    }
  };

  const deleteExistingHabit = () => {
    if (!existing || isLifecycleSaving) return;
    setActionsVisible(false);
    Alert.alert(
      'Delete habit?',
      `Delete “${existing.title}” and all of its completion history? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setIsLifecycleSaving(true);
            remove(existing.id)
              .then(deleted => {
                if (!deleted) {
                  Alert.alert(
                    'Unable to delete habit',
                    'The habit could not be deleted. Please try again.',
                  );
                  return;
                }
                navigation.goBack();
              })
              .catch(() => {
                Alert.alert(
                  'Unable to delete habit',
                  'The habit could not be deleted. Please try again.',
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
      'Pause & Archive habit?',
      `“${existing.title}” will be removed from Today. You can resume it from History → All Habits.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause & Archive',
          onPress: () => {
            setIsLifecycleSaving(true);
            setArchived(existing.id, true)
              .then(archived => {
                if (!archived) {
                  Alert.alert(
                    'Unable to archive habit',
                    'The habit could not be archived. Please try again.',
                  );
                  return;
                }
                navigation.goBack();
              })
              .catch(() => {
                Alert.alert(
                  'Unable to archive habit',
                  'The habit could not be archived. Please try again.',
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
        <AppHeader title="Create a new habit" onBack={navigation.goBack} />
        <View style={styles.habitTypeRow}>
          {habitTypes.map(({ value, label, icon: Icon }) => {
            const selected = value === habitType;
            return (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={label.replace('\n', ' ')}
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
                    selected && styles.accentActiveText,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.habitTypeDescription}>
          <Text style={styles.habitTypeDescriptionTitle}>
            {typeDefinition.label.replace('\n', ' ')}
          </Text>
          <Text style={styles.habitTypeDescriptionText}>
            {typeDefinition.description}
          </Text>
        </View>
        <AppButton
          title="＋  CREATE YOUR OWN"
          onPress={() => setEditingDetails(true)}
          style={styles.createOwnButton}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll keyboard style={styles.form}>
      <AppHeader
        title={existing ? 'EDIT HABIT' : `${habitType.replace('_', '-')} HABIT`}
        onBack={() =>
          existing ? navigation.goBack() : setEditingDetails(false)
        }
        right={
          existing ? (
            <Pressable
              accessibilityLabel="Open habit actions"
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
        label="HABIT NAME"
        autoFocus={!existing}
        value={title}
        onChangeText={setTitle}
        placeholder={
          habitType === 'NEGATIVE'
            ? 'e.g. Avoid smoking'
            : habitType === 'ONE_TIME'
            ? 'e.g. Take a medical test'
            : 'e.g. Read for 10 minutes'
        }
        maxLength={80}
      />
      <View style={styles.appearanceCard}>
        <Pressable
          accessibilityLabel="Choose habit icon"
          onPress={() => {
            setIconDraft(iconName);
            setIconSheetVisible(true);
          }}
          style={styles.appearanceRow}
        >
          <View style={[styles.appearancePreview, backgroundColorStyle(color)]}>
            {SelectedIcon ? (
              <SelectedIcon color={colors.onPrimary} size={23} />
            ) : null}
          </View>
          <Text style={styles.appearanceLabel}>Icon</Text>
          <ChevronRight color={colors.textSecondary} size={21} />
        </Pressable>
        <View style={styles.appearanceDivider} />
        <Pressable
          accessibilityLabel="Choose habit color"
          onPress={() => {
            setColorDraft(color);
            setColorSheetVisible(true);
          }}
          style={styles.appearanceRow}
        >
          <Palette color={colors.textSecondary} size={23} />
          <Text style={styles.appearanceLabel}>Color</Text>
          <View style={[styles.colorPreview, backgroundColorStyle(color)]} />
          <ChevronRight color={colors.textSecondary} size={21} />
        </Pressable>
      </View>
      {habitType === 'ONE_TIME' ? (
        <>
          <Text style={styles.label}>WHEN</Text>
          <Pressable
            accessibilityLabel="Choose one-time task date"
            onPress={() => setTargetDateSheetVisible(true)}
            style={styles.formRowCard}
          >
            <CalendarDays color={colors.textSecondary} size={22} />
            <Text style={styles.formRowLabel}>Do it on</Text>
            <Text style={styles.formRowValue}>
              {fromDateKey(targetDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <ChevronRight color={colors.textSecondary} size={21} />
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.label}>REPEAT</Text>
          <Pressable
            accessibilityLabel="Edit habit days"
            onPress={() => setScheduleSheetVisible(true)}
            style={styles.formRowCard}
          >
            <CalendarDays color={colors.textSecondary} size={22} />
            <Text style={styles.formRowLabel}>Habit days</Text>
            <Text numberOfLines={1} style={styles.formRowValue}>
              {scheduleSummary}
            </Text>
            <ChevronRight color={colors.textSecondary} size={21} />
          </Pressable>
        </>
      )}
      <Text style={styles.label}>DO IT AT</Text>
      <View style={styles.createTimeGrid}>
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
                  selected && styles.accentActiveText,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {habitType === 'REGULAR' ? (
        <>
          <Text style={styles.label}>DAILY GOAL</Text>
          <View style={styles.goalModeRow}>
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
                      selected && styles.accentActiveText,
                    ]}
                  >
                    {mode}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {goalMode !== 'OFF' ? (
            <View style={styles.goalTargetCard}>
              <Target color={colors.primary} size={22} />
              <Text style={styles.formRowLabel}>Target</Text>
              <Pressable
                accessibilityLabel="Decrease goal target"
                onPress={() => setGoalTarget(value => Math.max(1, value - 1))}
                style={styles.smallStepButton}
              >
                <Minus color={colors.text} size={18} />
              </Pressable>
              <Text style={styles.goalTargetValue}>
                {goalTarget} {goalMode === 'DURATION' ? 'min' : 'reps'}
              </Text>
              <Pressable
                accessibilityLabel="Increase goal target"
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
          label="MOTIVATION (OPTIONAL)"
          value={motivationalText}
          onChangeText={setMotivationalText}
          placeholder="Why do you want to avoid this?"
          maxLength={160}
          multiline
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: advancedVisible }}
        onPress={() => setAdvancedVisible(value => !value)}
        style={styles.advancedHeader}
      >
        <Text style={styles.advancedTitle}>Advanced settings</Text>
        <ChevronDown
          color={colors.textSecondary}
          size={22}
          style={advancedVisible ? styles.advancedChevronOpen : undefined}
        />
      </Pressable>
      {advancedVisible ? (
        <View style={styles.advancedContent}>
          <Text style={styles.label}>REMINDER</Text>
          <View style={styles.reminder}>
            <Pressable
              accessibilityLabel={`Edit reminder time, currently ${formatLocalTime(
                reminderTime,
              )}`}
              onPress={() => setTimeEditorVisible(true)}
              style={styles.reminderBody}
            >
              <View style={styles.reminderIcon}>
                <Bell color={colors.primary} size={21} />
              </View>
              <View style={styles.reminderCopy}>
                <Text style={styles.reminderTitle}>
                  Reminder for this habit
                </Text>
                <Text style={styles.reminderHint}>
                  {formatLocalTime(reminderTime)} • preference only
                </Text>
              </View>
            </Pressable>
            <Switch
              accessibilityLabel="Enable habit reminder"
              value={reminder}
              onValueChange={setReminder}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={colors.onPrimary}
            />
          </View>
          {habitType !== 'ONE_TIME' ? (
            <>
              <Text style={styles.label}>END ON</Text>
              <Pressable
                accessibilityLabel="Choose habit end date"
                onPress={() => setEndDateSheetVisible(true)}
                style={styles.formRowCard}
              >
                <CalendarDays color={colors.textSecondary} size={22} />
                <Text style={styles.formRowLabel}>End date</Text>
                <Text style={styles.formRowValue}>
                  {endDate ? formatShortDate(fromDateKey(endDate)) : 'Off'}
                </Text>
                <ChevronRight color={colors.textSecondary} size={21} />
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}
      <AppButton
        title={existing ? 'SAVE CHANGES' : 'SAVE'}
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
          accessibilityLabel="Close habit actions"
          style={styles.editActionsBackdrop}
          onPress={() => setActionsVisible(false)}
        >
          <Pressable
            style={[styles.editActionsMenu, { top: insets.top + 52 }]}
            onPress={event => event.stopPropagation()}
          >
            <Pressable
              accessibilityLabel="Pause and archive habit"
              accessibilityRole="button"
              onPress={archiveExistingHabit}
              style={styles.editActionItem}
            >
              <Archive color={colors.textSecondary} size={19} />
              <Text style={styles.editActionText}>PAUSE &amp; ARCHIVE</Text>
            </Pressable>
            <View style={styles.editActionDivider} />
            <Pressable
              accessibilityLabel="Delete habit"
              accessibilityRole="button"
              onPress={deleteExistingHabit}
              style={styles.editActionItem}
            >
              <Trash2 color={colors.red} size={19} />
              <Text style={styles.editActionDangerText}>DELETE</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <BottomSheet
        visible={iconSheetVisible}
        title="Habit icon"
        onClose={() => setIconSheetVisible(false)}
      >
        <View style={styles.iconPickerGrid}>
          {HABIT_ICONS.map(({ id, label, icon: Icon }) => {
            const selected = iconDraft === id;
            return (
              <Pressable
                key={id}
                accessibilityLabel={`${label} icon`}
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
        <View style={styles.createSheetActions}>
          <AppButton
            title="CANCEL"
            variant="secondary"
            onPress={() => setIconSheetVisible(false)}
            style={styles.createSheetAction}
          />
          <AppButton
            title="SAVE"
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
        title="Habit color"
        onClose={() => setColorSheetVisible(false)}
      >
        <View style={styles.colorPickerGrid}>
          {HABIT_COLORS.map(option => {
            const selected = colorDraft === option.value;
            return (
              <Pressable
                key={option.id}
                accessibilityLabel={`${option.label} habit color`}
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
        <View style={styles.createSheetActions}>
          <AppButton
            title="CANCEL"
            variant="secondary"
            onPress={() => setColorSheetVisible(false)}
            style={styles.createSheetAction}
          />
          <AppButton
            title="SAVE"
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
        title="Do it on"
        value={targetDate}
        onCancel={() => setTargetDateSheetVisible(false)}
        onSave={value => {
          if (value) setTargetDate(value);
          setTargetDateSheetVisible(false);
        }}
      />
      <DateSheet
        visible={endDateSheetVisible}
        title="End on"
        value={endDate}
        allowOff
        onCancel={() => setEndDateSheetVisible(false)}
        onSave={value => {
          setEndDate(value);
          setEndDateSheetVisible(false);
        }}
      />
      <ReminderTimeModal
        visible={timeEditorVisible}
        title="Set habit reminder"
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
