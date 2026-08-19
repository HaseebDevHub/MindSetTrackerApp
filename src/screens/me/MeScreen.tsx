import React, { useCallback, useMemo } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import {
  Bell,
  Crown,
  Languages,
  MessageSquare,
  RefreshCw,
  Settings,
  Share2,
  Star,
  type LucideIcon,
} from 'lucide-react-native';
import { SmallVerticalListSeparator } from '../../components/common/ListSeparator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SettingRow } from '../../components/common/SettingRow';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import type { MeStackParamList } from '../../types/models';
import useStyles from './MeScreenStyle';

type Props = NativeStackScreenProps<MeStackParamList, 'MeHome'>;

export function MeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const premium = useAppStore(s => s.isPremium);
  const share = useCallback(async () => {
    try {
      await Share.share({
        message: 'Build better routines with Mindset Tracker.',
      });
    } catch {
      Alert.alert('Sharing unavailable', 'Please try again later.');
    }
  }, []);
  const settingsRows = useMemo<
    { id: string; icon: LucideIcon; title: string; onPress: () => void }[]
  >(
    () => [
      {
        id: 'notifications',
        icon: Bell,
        title: 'Notification',
        onPress: () => navigation.navigate('Notifications'),
      },
      {
        id: 'general',
        icon: Settings,
        title: 'General settings',
        onPress: () => navigation.navigate('GeneralSettings'),
      },
      {
        id: 'language',
        icon: Languages,
        title: 'Language Options',
        onPress: () => navigation.navigate('Language'),
      },
      {
        id: 'share',
        icon: Share2,
        title: 'Share with friends',
        onPress: share,
      },
      {
        id: 'rate',
        icon: Star,
        title: 'Rate us',
        onPress: () =>
          Alert.alert(
            'Thank you!',
            'Store ratings are not connected in this UI preview.',
          ),
      },
      {
        id: 'feedback',
        icon: MessageSquare,
        title: 'Feedback',
        onPress: () => navigation.navigate('Feedback'),
      },
    ],
    [navigation, share],
  );
  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>ME</Text>
      </View>
      <FlashList
        data={settingsRows}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SettingRow
            icon={item.icon}
            title={item.title}
            onPress={item.onPress}
          />
        )}
        ItemSeparatorComponent={SmallVerticalListSeparator}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.page}
        ListHeaderComponent={
          <>
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
          </>
        }
        ListFooterComponent={
          <Text style={styles.version}>Mindset Tracker • Version 1.0.0</Text>
        }
      />
    </ScreenContainer>
  );
}
