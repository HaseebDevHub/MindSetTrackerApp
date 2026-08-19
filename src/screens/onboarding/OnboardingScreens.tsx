import React, { useEffect, useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import {
  Apple,
  BatteryCharging,
  BedDouble,
  Check,
  ChevronLeft,
  Dumbbell,
  HeartHandshake,
  Lightbulb,
  Moon,
  Sparkles,
  Target,
  Utensils,
  Waves,
} from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import {
  SmallVerticalListSeparator,
  VerticalListSeparator,
} from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { TimeWheelPicker } from '../../components/onboarding/TimeWheelPicker';
import { colors } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import type { OnboardingStackParamList } from '../../types/models';
import { keyByTitle } from '../../utils/lists';
import styles from './OnboardingScreenStyle';

type Props<T extends keyof OnboardingStackParamList> = NativeStackScreenProps<
  OnboardingStackParamList,
  T
>;

function OnboardingTitle({
  title,
  subtitle,
  step,
  back,
}: {
  title: string;
  subtitle: string;
  step: number;
  back?: () => void;
}) {
  return (
    <>
      <View style={styles.top}>
        {back ? (
          <Pressable accessibilityLabel="Go back" hitSlop={12} onPress={back}>
            <ChevronLeft color={colors.text} size={28} />
          </Pressable>
        ) : (
          <View style={styles.backSpace} />
        )}
      </View>
      <OnboardingProgress step={step} />
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </>
  );
}

export function WakeTimeScreen({ navigation }: Props<'WakeTime'>) {
  const value = useAppStore(s => s.wakeTime);
  const setValue = useAppStore(s => s.setWakeTime);
  return (
    <ScreenContainer>
      <OnboardingTitle
        step={1}
        title="What time do you usually get up?"
        subtitle="Choose the time you usually start a new day"
      />
      <TimeWheelPicker value={value} onChange={setValue} />
      <View style={styles.spacer} />
      <AppButton title="NEXT" onPress={() => navigation.navigate('BedTime')} />
      <Text style={styles.existing}>Already using Mindset Tracker?</Text>
      <Pressable accessibilityRole="button" onPress={() => {}}>
        <Text style={styles.restore}>Restore existing data</Text>
      </Pressable>
    </ScreenContainer>
  );
}

export function BedTimeScreen({ navigation }: Props<'BedTime'>) {
  const value = useAppStore(s => s.endTime);
  const setValue = useAppStore(s => s.setEndTime);
  return (
    <ScreenContainer>
      <OnboardingTitle
        step={2}
        back={navigation.goBack}
        title="What time do you usually end you day?"
        subtitle="We'll remind you to finish your checklist before that"
      />
      <TimeWheelPicker value={value} onChange={setValue} />
      <View style={styles.spacer} />
      <AppButton title="NEXT" onPress={() => navigation.navigate('Goals')} />
    </ScreenContainer>
  );
}

const goals = [
  { title: 'Live healthier', icon: Apple },
  { title: 'Relieve pressure', icon: Waves },
  { title: 'Try new things', icon: Lightbulb },
  { title: 'Be more focused', icon: Target },
  { title: 'Better relationship', icon: HeartHandshake },
  { title: 'Sleep better', icon: Moon },
];

function GoalCard({
  title,
  Icon,
  selected,
  onPress,
}: {
  title: string;
  Icon: typeof Apple;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const press = () => {
    scale.value = withSequence(
      withTiming(0.96, { duration: 90 }),
      withTiming(1, { duration: 130 }),
    );
    onPress();
  };
  return (
    <Animated.View
      style={[styles.goalCard, selected && styles.goalSelected, animatedStyle]}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        onPress={press}
        style={styles.goalPress}
      >
        <Icon color={selected ? colors.text : colors.primary} size={29} />
        <Text style={styles.goalTitle}>{title}</Text>
        {selected ? (
          <View style={styles.checkBadge}>
            <Check color={colors.selectedBlue} size={13} strokeWidth={3} />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export function GoalsScreen({ navigation }: Props<'Goals'>) {
  const selected = useAppStore(s => s.targets);
  const toggle = useAppStore(s => s.toggleTarget);
  return (
    <ScreenContainer>
      <OnboardingTitle
        step={3}
        back={navigation.goBack}
        title="What's your target?"
        subtitle="Help us understand your needs better"
      />
      <FlashList
        data={goals}
        numColumns={2}
        keyExtractor={keyByTitle}
        extraData={selected}
        renderItem={({ item: { title, icon } }) => (
          <View style={styles.goalCell}>
            <GoalCard
              title={title}
              Icon={icon}
              selected={selected.includes(title)}
              onPress={() => toggle(title)}
            />
          </View>
        )}
        ItemSeparatorComponent={VerticalListSeparator}
        scrollEnabled={false}
        style={styles.goalGrid}
      />
      <View style={styles.spacer} />
      <AppButton
        title="NEXT"
        onPress={() => navigation.navigate('FirstHabit')}
      />
    </ScreenContainer>
  );
}

const presets = [
  { title: 'Sleep over 8h', icon: BedDouble },
  { title: 'Have a healthy meal', icon: Utensils },
  { title: 'Drink 8 cups of water', icon: Waves },
  { title: 'Workout', icon: Dumbbell },
  { title: 'Walking', icon: BatteryCharging },
];

export function FirstHabitScreen({ navigation }: Props<'FirstHabit'>) {
  const stored = useAppStore(s => s.firstHabit);
  const setStored = useAppStore(s => s.setFirstHabit);
  const [custom, setCustom] = useState(
    stored && !presets.some(p => p.title === stored) ? stored : '',
  );
  const chooseCustom = () => {
    if (custom.trim()) {
      setStored(custom.trim());
    }
  };
  const next = () => navigation.navigate('PlanGenerator');
  return (
    <ScreenContainer scroll keyboard>
      <OnboardingTitle
        step={4}
        back={navigation.goBack}
        title="Choose the first habit that you'd like to build"
        subtitle="Start small. You can always add more later."
      />
      <FlashList
        data={presets}
        keyExtractor={keyByTitle}
        extraData={stored}
        renderItem={({ item: { title, icon: Icon } }) => {
          const active = stored === title;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setStored(title);
                setCustom('');
              }}
              style={[styles.preset, active && styles.presetActive]}
            >
              <Icon color={active ? colors.text : colors.primary} size={21} />
              <Text style={styles.presetTitle}>{title}</Text>
              {active ? <Check color={colors.text} size={20} /> : null}
            </Pressable>
          );
        }}
        ItemSeparatorComponent={SmallVerticalListSeparator}
        scrollEnabled={false}
        style={styles.presetList}
      />
      <Text style={styles.or}>Or type your own</Text>
      <View style={styles.customRow}>
        <TextInput
          accessibilityLabel="Custom habit"
          value={custom}
          onChangeText={text => {
            setCustom(text);
            if (!text) {
              setStored(undefined);
            }
          }}
          onSubmitEditing={chooseCustom}
          placeholder="Drink 8 glasses of water a day"
          placeholderTextColor={colors.muted}
          style={styles.customInput}
        />
        {custom.trim() ? (
          <Pressable
            accessibilityLabel="Confirm custom habit"
            onPress={chooseCustom}
            style={styles.confirm}
          >
            <Check color={colors.text} size={20} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.firstActions}>
        <AppButton
          title="SKIP"
          variant="ghost"
          onPress={next}
          style={styles.flexButton}
        />
        <AppButton
          title="NEXT"
          onPress={() => {
            chooseCustom();
            next();
          }}
          style={styles.flexButton}
        />
      </View>
    </ScreenContainer>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const progressSteps = [
  { at: 0, value: 0, text: '' },
  { at: 450, value: 20, text: 'Analyzing your time schedule...' },
  { at: 1350, value: 60, text: 'Selecting habits for your target...' },
  { at: 2250, value: 71, text: 'Preparing your first habit...' },
  { at: 3200, value: 100, text: 'Finished!' },
];

export function PlanGeneratorScreen({ navigation }: Props<'PlanGenerator'>) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Getting things ready...');
  const animated = useSharedValue(0);
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const circleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value / 100),
  }));
  useEffect(() => {
    animated.value = withTiming(100, {
      duration: 3200,
      easing: Easing.inOut(Easing.cubic),
    });
    const timers: ReturnType<typeof setTimeout>[] = [];
    progressSteps.forEach(step => {
      timers.push(
        setTimeout(() => {
          setProgress(step.value);
          if (step.text) {
            setMessage(step.text);
          }
        }, step.at),
      );
    });
    timers.push(setTimeout(() => navigation.replace('ValueProposition'), 3800));
    return () => timers.forEach(clearTimeout);
  }, [animated, navigation]);
  return (
    <ScreenContainer style={styles.generator}>
      <Text style={styles.heading}>
        {progress === 100
          ? 'Everything is done!'
          : 'Generating your habit plan...'}
      </Text>
      <View style={styles.progressWrap}>
        <Svg width={200} height={200} viewBox="0 0 200 200">
          <Circle
            cx="100"
            cy="100"
            r={radius}
            stroke={colors.surfaceSecondary}
            strokeWidth="12"
            fill="none"
          />
          <AnimatedCircle
            animatedProps={circleProps}
            cx="100"
            cy="100"
            r={radius}
            stroke={colors.primary}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            rotation="-90"
            origin="100, 100"
          />
        </Svg>
        <Text style={styles.percent}>{progress}%</Text>
      </View>
      <Animated.Text
        key={message}
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(150)}
        style={styles.generatorMessage}
      >
        {message}
      </Animated.Text>
    </ScreenContainer>
  );
}

const benefits = [
  { icon: Check, text: 'Plan daily routine with a habit list' },
  { icon: Target, text: 'Regulate your life with smart reminders' },
  { icon: Sparkles, text: 'Join scientifically designed journeys' },
  { icon: BatteryCharging, text: 'Keep your streak and consolidate results' },
];

export function ValuePropositionScreen({
  navigation,
}: Props<'ValueProposition'>) {
  const { height } = useWindowDimensions();
  const finish = useAppStore(s => s.finishOnboarding);
  return (
    <ScreenContainer scroll style={styles.valueScreen}>
      <View style={[styles.hero, { height: Math.min(310, height * 0.36) }]}>
        <View style={styles.heroGlow} />
        <View style={styles.heroPhone}>
          <View style={styles.heroTick}>
            <Check size={38} color={colors.text} strokeWidth={3} />
          </View>
          <View style={styles.heroLine} />
          <View style={[styles.heroLine, styles.heroLineShort]} />
        </View>
        <Sparkles style={styles.sparkle} color={colors.yellow} size={38} />
      </View>
      <Text style={[styles.heading, styles.center]}>Meet the better you</Text>
      <Text style={[styles.subtitle, styles.center]}>
        Enjoy your journey of becoming a better you
      </Text>
      <FlashList
        data={benefits}
        keyExtractor={item => item.text}
        renderItem={({ item: { icon: Icon, text } }) => (
          <View style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <Icon color={colors.primary} size={20} />
            </View>
            <Text style={styles.benefitText}>{text}</Text>
          </View>
        )}
        ItemSeparatorComponent={VerticalListSeparator}
        scrollEnabled={false}
        style={styles.benefits}
      />
      <AppButton
        title="START NOW!"
        onPress={() => {
          finish();
          navigation
            .getParent()
            ?.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }),
            );
        }}
      />
    </ScreenContainer>
  );
}
