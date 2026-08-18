import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  Switch,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Bell,
  Check,
  CircleHelp,
  Clock,
  Crown,
  Globe,
  Heart,
  Languages,
  MessageSquare,
  Moon,
  RefreshCw,
  Settings,
  Share2,
  Smartphone,
  Star,
  Volume2,
  Zap,
} from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { AppInput } from '../../components/common/AppInput';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SettingRow } from '../../components/common/SettingRow';
import { colors } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import type { MeStackParamList } from '../../types/models';
import styles from './MeScreenStyle';

type Props<T extends keyof MeStackParamList> = NativeStackScreenProps<
  MeStackParamList,
  T
>;

export function MeScreen({ navigation }: Props<'MeHome'>) {
  const premium = useAppStore(s => s.isPremium);
  const share = async () => {
    try {
      await Share.share({
        message: 'Build better routines with Mindset Tracker.',
      });
    } catch {
      Alert.alert('Sharing unavailable', 'Please try again later.');
    }
  };
  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>ME</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.page}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Alert.alert(
              'Backup & Restore',
              'Cloud synchronization will be available in a future update.',
            )
          }
          style={styles.backup}
        >
          <View style={styles.backupIcon}>
            <RefreshCw color={colors.primary} size={25} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.backupTitle}>Backup & Restore</Text>
            <Text style={styles.subtitle}>
              Sign in and synchronize your data
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Premium')}
          style={styles.premium}
        >
          <Crown color={colors.yellow} size={30} />
          <View style={styles.copy}>
            <Text style={styles.premiumTitle}>
              {premium ? 'PREMIUM ACTIVE' : 'GO PREMIUM'}
            </Text>
            <Text style={styles.premiumSubtitle}>
              {premium
                ? 'All mock premium features unlocked'
                : 'Unlock your best routines'}
            </Text>
          </View>
        </Pressable>
        <Text style={styles.section}>SETTINGS</Text>
        <View style={styles.rows}>
          <SettingRow
            icon={Bell}
            title="Notification"
            onPress={() => navigation.navigate('Notifications')}
          />
          <SettingRow
            icon={Settings}
            title="General settings"
            onPress={() => navigation.navigate('GeneralSettings')}
          />
          <SettingRow
            icon={Languages}
            title="Language Options"
            onPress={() => navigation.navigate('Language')}
          />
          <SettingRow
            icon={Share2}
            title="Share with friends"
            onPress={share}
          />
          <SettingRow
            icon={Star}
            title="Rate us"
            onPress={() =>
              Alert.alert(
                'Thank you!',
                'Store ratings are not connected in this UI preview.',
              )
            }
          />
          <SettingRow
            icon={MessageSquare}
            title="Feedback"
            onPress={() => navigation.navigate('Feedback')}
          />
        </View>
        <Text style={styles.version}>Mindset Tracker • Version 1.0.0</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function SettingsShell({
  title,
  navigation,
  children,
}: {
  title: string;
  navigation: { goBack: () => void };
  children: React.ReactNode;
}) {
  return (
    <ScreenContainer padded={false}>
      <View style={styles.headerPad}>
        <AppHeader title={title} onBack={navigation.goBack} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.settingsPage}
      >
        {children}
      </ScrollView>
    </ScreenContainer>
  );
}

export function NotificationSettingsScreen({
  navigation,
}: Props<'Notifications'>) {
  const [enabled, setEnabled] = useState(true);
  const [daily, setDaily] = useState(true);
  const [habits, setHabits] = useState(false);
  return (
    <SettingsShell title="NOTIFICATION" navigation={navigation}>
      <View style={styles.notice}>
        <Bell color={colors.primary} size={21} />
        <Text style={styles.noticeText}>
          These preferences are a UI preview. No notification permissions are
          requested and nothing is scheduled.
        </Text>
      </View>
      <SettingRow
        icon={Zap}
        title="Enable reminders"
        subtitle="Master reminder preference"
        right={
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        }
      />
      <SettingRow
        icon={Moon}
        title="Daily reminder"
        subtitle="Finish your checklist each evening"
        right={
          <Switch
            disabled={!enabled}
            value={enabled && daily}
            onValueChange={setDaily}
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        }
      />
      <SettingRow icon={Clock} title="Reminder time" subtitle="8:00 PM" />
      <SettingRow
        icon={Bell}
        title="Habit reminders"
        subtitle="Use preferences set on each habit"
        right={
          <Switch
            disabled={!enabled}
            value={enabled && habits}
            onValueChange={setHabits}
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        }
      />
    </SettingsShell>
  );
}

export function GeneralSettingsScreen({
  navigation,
}: Props<'GeneralSettings'>) {
  const [sound, setSound] = useState(true);
  const [haptic, setHaptic] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [week, setWeek] = useState<'Sunday' | 'Monday'>('Sunday');
  return (
    <SettingsShell title="GENERAL SETTINGS" navigation={navigation}>
      <Text style={styles.sectionNoMargin}>APPEARANCE</Text>
      <SettingRow icon={Moon} title="Appearance" subtitle="Dark" />
      <Text style={styles.section}>WEEK & INTERACTION</Text>
      <View style={styles.choiceRow}>
        {(['Sunday', 'Monday'] as const).map(day => (
          <Pressable
            key={day}
            onPress={() => setWeek(day)}
            style={[styles.choice, week === day && styles.choiceActive]}
          >
            <Text
              style={[
                styles.choiceText,
                week === day && styles.choiceTextActive,
              ]}
            >
              {day} start
            </Text>
          </Pressable>
        ))}
      </View>
      <SettingRow
        icon={Volume2}
        title="Sound"
        right={
          <Switch
            value={sound}
            onValueChange={setSound}
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        }
      />
      <SettingRow
        icon={Smartphone}
        title="Haptic feedback"
        right={
          <Switch
            value={haptic}
            onValueChange={setHaptic}
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        }
      />
      <SettingRow
        icon={CircleHelp}
        title="Confirm completion"
        subtitle="Ask before a habit is checked"
        right={
          <Switch
            value={confirm}
            onValueChange={setConfirm}
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        }
      />
    </SettingsShell>
  );
}

const languages = ['English', 'Urdu', 'Spanish', 'French', 'German'];
export function LanguageSettingsScreen({ navigation }: Props<'Language'>) {
  const [selected, setSelected] = useState('English');
  return (
    <SettingsShell title="LANGUAGE OPTIONS" navigation={navigation}>
      <Text style={styles.settingsIntro}>
        Choose the language shown in a future localized version of Mindset
        Tracker.
      </Text>
      {languages.map(language => (
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: selected === language }}
          key={language}
          onPress={() => setSelected(language)}
          style={[
            styles.language,
            selected === language && styles.languageActive,
          ]}
        >
          <Globe
            color={selected === language ? colors.text : colors.textSecondary}
            size={21}
          />
          <Text style={styles.languageText}>{language}</Text>
          {selected === language ? (
            <View style={styles.languageCheck}>
              <Check color={colors.selectedBlue} size={15} strokeWidth={3} />
            </View>
          ) : null}
        </Pressable>
      ))}
    </SettingsShell>
  );
}

export function FeedbackScreen({ navigation }: Props<'Feedback'>) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <ScreenContainer>
        <AppHeader title="FEEDBACK" onBack={navigation.goBack} />
        <View style={styles.sent}>
          <View style={styles.sentIcon}>
            <Heart color={colors.text} fill={colors.text} size={34} />
          </View>
          <Text style={styles.sentTitle}>Thank you!</Text>
          <Text style={styles.sentText}>
            Your feedback is saved for this preview. No data was sent to a
            server.
          </Text>
          <AppButton
            title="DONE"
            onPress={navigation.goBack}
            style={styles.done}
          />
        </View>
      </ScreenContainer>
    );
  return (
    <ScreenContainer keyboard>
      <AppHeader title="FEEDBACK" onBack={navigation.goBack} />
      <Text style={styles.feedbackTitle}>Help us improve</Text>
      <Text style={styles.settingsIntro}>
        Tell us what feels great and what could be better.
      </Text>
      <AppInput
        multiline
        value={message}
        onChangeText={setMessage}
        placeholder="Write your feedback here..."
        maxLength={1000}
      />
      <Text style={styles.character}>{message.length}/1000</Text>
      <AppButton
        title="SEND FEEDBACK"
        disabled={!message.trim()}
        onPress={() => setSent(true)}
        style={styles.send}
      />
    </ScreenContainer>
  );
}

const premiumBenefits = [
  'Unlimited habits and journeys',
  'Deeper progress insights',
  'Premium themes and icons',
  'Support future development',
];
export function PremiumScreen({ navigation }: Props<'Premium'>) {
  const premium = useAppStore(s => s.isPremium);
  const setPremium = useAppStore(s => s.setPremium);
  return (
    <ScreenContainer scroll style={styles.premiumPage}>
      <AppHeader title="PREMIUM" onBack={navigation.goBack} />
      <View style={styles.premiumHero}>
        <View style={styles.crownCircle}>
          <Crown color={colors.yellow} size={52} />
        </View>
        <Text style={styles.premiumHeroTitle}>Make every day count</Text>
        <Text style={styles.premiumHeroText}>
          Explore the full Mindset Tracker experience.
        </Text>
      </View>
      <View style={styles.benefits}>
        {premiumBenefits.map(item => (
          <View key={item} style={styles.benefit}>
            <View style={styles.benefitCheck}>
              <Check color={colors.text} size={15} strokeWidth={3} />
            </View>
            <Text style={styles.benefitText}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={styles.priceNotice}>
        <Text style={styles.priceNoticeTitle}>UI preview</Text>
        <Text style={styles.priceNoticeText}>
          No pricing, subscription, or payment is configured. The button below
          only changes local preview state.
        </Text>
      </View>
      <AppButton
        title={premium ? 'PREMIUM IS ACTIVE' : 'PREVIEW PREMIUM'}
        disabled={premium}
        onPress={() => setPremium(true)}
      />
      <Text style={styles.legal}>No purchase will be made.</Text>
    </ScreenContainer>
  );
}
