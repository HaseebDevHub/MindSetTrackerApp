import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useFocusEffect } from '@react-navigation/native';
import { JourneyDayCard } from './components/JourneyDayCard';
import { JourneyProgressGrid } from './components/JourneyProgressGrid';
import type { JourneyDay } from '../../utils/journeyAnalytics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Lightbulb,
  MoreVertical,
  Trash2,
  TrendingUp,
} from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  AppState,
  Text,
  View,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ToastMessage } from '../../components/common/ToastMessage';
import { useTheme } from '../../context/ThemeContext';
import { journeys } from '../../data/journeyPlans';
import { useTranslation } from '../../localization';
import { useAppStore } from '../../store/useAppStore';
import type { JourneyStackParamList } from '../../types/models';
import { toDateKey } from '../../utils/dates';
import {
  getJourneyDays,
  getJourneyMetrics,
} from '../../utils/journeyAnalytics';
import useStyles from './ActiveJourneyScreenStyle';

const dayKey = (day: JourneyDay) => day.dateKey;

type Props = NativeStackScreenProps<JourneyStackParamList, 'ActiveJourney'>;

export function ActiveJourneyScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
  const styles = useStyles();
  const enrollment = useAppStore(state =>
    state.activeJourneys.find(item => item.id === route.params.activeJourneyId),
  );
  const toggleJourneyTask = useAppStore(state => state.toggleJourneyTask);
  const removeActiveJourney = useAppStore(state => state.removeActiveJourney);
  const journey = enrollment
    ? journeys.find(item => item.id === enrollment.journeyId)
    : undefined;
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);
  const [pendingTaskIds, setPendingTaskIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const [todayKey, setTodayKey] = React.useState(() => toDateKey(new Date()));
  const refreshDate = React.useCallback(
    () => setTodayKey(toDateKey(new Date())),
    [],
  );
  useFocusEffect(refreshDate);
  React.useEffect(() => {
    const timer = setInterval(refreshDate, 30_000);
    const subscription = AppState.addEventListener('change', refreshDate);
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [refreshDate]);
  const days = React.useMemo(
    () =>
      enrollment && journey
        ? getJourneyDays(enrollment, journey, todayKey)
        : [],
    [enrollment, journey, todayKey],
  );
  const [expandedDays, setExpandedDays] = React.useState<Set<number>>(
    () => new Set(),
  );
  const currentDay = days.find(day => day.status === 'current')?.dayNumber;
  React.useEffect(() => {
    setExpandedDays(new Set(currentDay ? [currentDay] : []));
  }, [currentDay, enrollment?.id]);
  const onExpand = React.useCallback(
    (day: number) =>
      setExpandedDays(previous => {
        const next = new Set(previous);
        if (next.has(day)) next.delete(day);
        else next.add(day);
        return next;
      }),
    [],
  );
  const pendingRef = React.useRef(new Set<string>());
  const metrics =
    enrollment && journey
      ? getJourneyMetrics(enrollment, journey, todayKey)
      : undefined;

  const handleToggle = React.useCallback(
    async (taskId: string, dateKey: string) => {
      if (!enrollment?.isActive || dateKey !== toDateKey(new Date())) return;
      const pendingKey = `${enrollment.id}:${dateKey}:${taskId}`;
      if (pendingRef.current.has(pendingKey)) return;
      pendingRef.current.add(pendingKey);
      setPendingTaskIds(current => new Set(current).add(taskId));
      try {
        const saved = await toggleJourneyTask(enrollment.id, taskId, dateKey);
        if (!saved) setErrorMessage(t('journey_task_save_error'));
      } catch {
        setErrorMessage(t('journey_task_save_error'));
      } finally {
        pendingRef.current.delete(pendingKey);
        setPendingTaskIds(current => {
          const next = new Set(current);
          next.delete(taskId);
          return next;
        });
      }
    },
    [enrollment?.id, enrollment?.isActive, toggleJourneyTask, t],
  );

  const renderDay = React.useCallback(
    ({ item }: ListRenderItemInfo<JourneyDay>) => (
      <JourneyDayCard
        day={item}
        expanded={expandedDays.has(item.dayNumber)}
        pendingIds={
          item.status === 'current' ? [...pendingTaskIds].join('|') : ''
        }
        readOnly={!enrollment?.isActive || Boolean(metrics?.isCompleted)}
        onExpand={onExpand}
        onToggle={handleToggle}
      />
    ),
    [
      expandedDays,
      pendingTaskIds,
      enrollment?.isActive,
      metrics?.isCompleted,
      onExpand,
      handleToggle,
    ],
  );

  const handleRemove = async () => {
    if (!enrollment || isRemoving) return;
    setIsRemoving(true);
    const removed = await removeActiveJourney(enrollment.id);
    setIsRemoving(false);
    if (!removed) {
      setMenuVisible(false);
      setErrorMessage(t('journey_remove_error'));
      return;
    }
    setMenuVisible(false);
    navigation.navigate('JourneyHome', {
      toastMessage: t('journey_removed_success'),
      toastRequestId: Date.now(),
    });
  };

  if (!enrollment || !journey || !metrics || !days.length) {
    return (
      <ScreenContainer style={styles.emptyPage}>
        <Pressable
          accessibilityLabel={t('common_back')}
          accessibilityRole="button"
          onPress={navigation.goBack}
          style={[styles.headerButton, isRTL && styles.emptyBackButtonRTL]}
        >
          {isRTL ? (
            <ChevronRight color={colors.text} size={25} />
          ) : (
            <ChevronLeft color={colors.text} size={25} />
          )}
        </Pressable>
        <Text style={[styles.emptyTitle, isRTL && styles.centeredTextRTL]}>
          {t('journey_unavailable')}
        </Text>
        <Text style={[styles.emptyCopy, isRTL && styles.centeredTextRTL]}>
          {t('journey_unavailable_description')}
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false}>
      <View style={[styles.header, isRTL && styles.rowRTL]}>
        <Pressable
          accessibilityLabel={t('common_back')}
          accessibilityRole="button"
          hitSlop={8}
          onPress={navigation.goBack}
          style={styles.headerButton}
        >
          {isRTL ? (
            <ChevronRight color={colors.text} size={25} />
          ) : (
            <ChevronLeft color={colors.text} size={25} />
          )}
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.activePill, isRTL && styles.rowRTL]}>
            <View style={styles.activeDot} />
            <Text
              style={[styles.activePillText, isRTL && styles.centeredTextRTL]}
            >
              {metrics.isCompleted
                ? t('journey_completed')
                : t('journey_active')}
            </Text>
          </View>
          <Text style={[styles.dayText, isRTL && styles.centeredTextRTL]}>
            {t('journey_day_of', {
              day: metrics.dayNumber,
              total: journey.durationDays,
            })}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={t('journey_options_accessibility')}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setMenuVisible(true)}
          style={styles.headerButton}
        >
          <MoreVertical color={colors.text} size={23} />
        </Pressable>
      </View>

      <FlashList
        data={days}
        keyExtractor={dayKey}
        renderItem={renderDay}
        extraData={expandedDays}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryTopRow, isRTL && styles.rowRTL]}>
                <View style={styles.summaryCopy}>
                  <View
                    style={[
                      styles.routineBadge,
                      isRTL && styles.routineBadgeRTL,
                    ]}
                  >
                    <Text
                      style={[styles.routineBadgeText, isRTL && styles.textRTL]}
                    >
                      {t('journey_day_routine', {
                        count: journey.durationDays,
                      })}
                    </Text>
                  </View>
                  <Text style={[styles.summaryTitle, isRTL && styles.textRTL]}>
                    {t(journey.titleKey)}
                  </Text>
                </View>
                <View style={styles.percentBox}>
                  <Text style={styles.percentValue}>{metrics.percentage}%</Text>
                  <Text
                    style={[
                      styles.percentLabel,
                      isRTL && styles.centeredTextRTL,
                    ]}
                  >
                    {t('journey_done')}
                  </Text>
                </View>
              </View>
              <View style={[styles.progressHeading, isRTL && styles.rowRTL]}>
                <Text style={[styles.progressLabel, isRTL && styles.textRTL]}>
                  {t('journey_today_progress')}
                </Text>
                <Text style={[styles.progressValue, isRTL && styles.textRTL]}>
                  {t('journey_tasks_completed', {
                    completed: metrics.completedToday,
                    total: metrics.totalTasks,
                  })}
                </Text>
              </View>
              <View
                style={[styles.progressTrack, isRTL && styles.progressTrackRTL]}
              >
                <View
                  style={[
                    styles.progressFill,
                    { width: `${metrics.percentage}%` },
                  ]}
                />
              </View>
              <View style={styles.divider} />
              <View style={[styles.statsRow, isRTL && styles.rowRTL]}>
                <View style={styles.statCard}>
                  <Text
                    style={[styles.statLabel, isRTL && styles.centeredTextRTL]}
                  >
                    {t('journey_streak')}
                  </Text>
                  <View style={[styles.statValueRow, isRTL && styles.rowRTL]}>
                    <Flame color={colors.yellow} size={17} />
                    <Text
                      style={[
                        styles.streakValue,
                        isRTL && styles.centeredTextRTL,
                      ]}
                    >
                      {metrics.streak}{' '}
                      {t(
                        metrics.streak === 1
                          ? 'journey_day_singular'
                          : 'journey_day_plural',
                      )}
                    </Text>
                  </View>
                </View>
                <View style={styles.statCard}>
                  <Text
                    style={[styles.statLabel, isRTL && styles.centeredTextRTL]}
                  >
                    {t('journey_consistency')}
                  </Text>
                  <View style={[styles.statValueRow, isRTL && styles.rowRTL]}>
                    <TrendingUp color={colors.green} size={17} />
                    <Text style={styles.consistencyValue}>
                      {metrics.consistency}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.tasksHeading, isRTL && styles.rowRTL]}>
              <Text style={[styles.tasksTitle, isRTL && styles.textRTL]}>
                {t('journey_daily_tasks')}
              </Text>
              <View style={styles.taskCountBadge}>
                <Text style={[styles.taskCountText, isRTL && styles.textRTL]}>
                  {t('journey_tasks_completed', {
                    completed: metrics.completedToday,
                    total: metrics.totalTasks,
                  })}
                </Text>
              </View>
              <Text
                style={[
                  styles.tapHint,
                  isRTL && styles.textRTL,
                  isRTL && styles.tapHintRTL,
                ]}
              >
                {metrics.isCompleted
                  ? t('journey_task_completed')
                  : t('journey_tap_to_toggle')}
              </Text>
            </View>

            <JourneyProgressGrid days={days} />
          </View>
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={[styles.tipCard, isRTL && styles.rowRTL]}>
            <View style={styles.tipIcon}>
              <Lightbulb color={colors.yellow} size={20} />
            </View>
            <View style={styles.tipCopy}>
              <Text style={[styles.tipTitle, isRTL && styles.textRTL]}>
                {t('journey_consistency_tip')}
              </Text>
              <Text style={[styles.tipText, isRTL && styles.textRTL]}>
                {metrics.isCompleted
                  ? t('journey_tip_finished', {
                      duration: journey.durationDays,
                    })
                  : metrics.percentage === 100
                  ? t('journey_tip_perfect', { streak: metrics.streak })
                  : t(
                      metrics.totalTasks - metrics.completedToday === 1
                        ? 'journey_tip_remaining_one'
                        : 'journey_tip_remaining_many',
                      {
                        count: metrics.totalTasks - metrics.completedToday,
                      },
                    )}
              </Text>
            </View>
          </View>
        }
      />

      <Modal
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
        statusBarTranslucent
        transparent
        visible={menuVisible}
      >
        <Pressable
          accessibilityLabel={t('journey_close_options')}
          onPress={() => setMenuVisible(false)}
          style={styles.modalBackdrop}
        >
          <Pressable
            accessibilityRole="menu"
            onPress={event => event.stopPropagation()}
            style={styles.menu}
          >
            <Text style={[styles.menuTitle, isRTL && styles.textRTL]}>
              {t('journey_options')}
            </Text>
            <Text style={[styles.menuCopy, isRTL && styles.textRTL]}>
              {t('journey_remove_description')}
            </Text>
            <Pressable
              accessibilityRole="menuitem"
              disabled={isRemoving}
              onPress={handleRemove}
              style={[styles.removeButton, isRTL && styles.rowRTL]}
            >
              {isRemoving ? (
                <ActivityIndicator color={colors.red} size="small" />
              ) : (
                <Trash2 color={colors.red} size={19} />
              )}
              <Text style={[styles.removeText, isRTL && styles.textRTL]}>
                {t('journey_remove')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isRemoving}
              onPress={() => setMenuVisible(false)}
              style={styles.cancelButton}
            >
              <Text
                style={[styles.cancelText, isRTL && styles.centeredTextRTL]}
              >
                {t('common_cancel')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ToastMessage
        message={errorMessage ?? ''}
        onDismiss={() => setErrorMessage(undefined)}
        type="error"
        visible={Boolean(errorMessage)}
        isRTL={isRTL}
      />
    </ScreenContainer>
  );
}
