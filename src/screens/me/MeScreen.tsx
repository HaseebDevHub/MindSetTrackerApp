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
import { useTranslation } from '../../localization';
import { useAppStore } from '../../store/useAppStore';
import type { MeStackParamList } from '../../types/models';
import useStyles from './MeScreenStyle';

type Props = NativeStackScreenProps<MeStackParamList, 'MeHome'>;

export function MeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
  const styles = useStyles();
  const premium = useAppStore(s => s.isPremium);
  const share = useCallback(async () => {
    try {
      await Share.share({
        message: t('settings_share_message'),
      });
    } catch {
      Alert.alert(
        t('settings_sharing_unavailable'),
        t('settings_try_again_later'),
      );
    }
  }, [t]);
  const settingsRows = useMemo<
    { id: string; icon: LucideIcon; title: string; onPress: () => void }[]
  >(
    () => [
      {
        id: 'notifications',
        icon: Bell,
        title: t('settings_notification'),
        onPress: () => navigation.navigate('Notifications'),
      },
      {
        id: 'general',
        icon: Settings,
        title: t('settings_general'),
        onPress: () => navigation.navigate('GeneralSettings'),
      },
      {
        id: 'language',
        icon: Languages,
        title: t('settings_language'),
        onPress: () => navigation.navigate('Language'),
      },
      {
        id: 'share',
        icon: Share2,
        title: t('settings_share'),
        onPress: share,
      },
      {
        id: 'rate',
        icon: Star,
        title: t('settings_rate'),
        onPress: () =>
          Alert.alert(t('settings_thank_you'), t('settings_rating_preview')),
      },
      {
        id: 'feedback',
        icon: MessageSquare,
        title: t('settings_feedback'),
        onPress: () => navigation.navigate('Feedback'),
      },
    ],
    [navigation, share, t],
  );
  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Text style={[styles.pageTitle, isRTL && styles.textRTL]}>
          {t('settings_me')}
        </Text>
      </View>
      <FlashList
        data={settingsRows}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SettingRow
            icon={item.icon}
            title={item.title}
            onPress={item.onPress}
            isRTL={isRTL}
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
                  t('settings_backup'),
                  t('settings_backup_unavailable'),
                )
              }
              style={[styles.backup, isRTL && styles.rowRTL]}
            >
              <View style={styles.backupIcon}>
                <RefreshCw color={colors.primary} size={25} />
              </View>
              <View style={styles.copy}>
                <Text style={[styles.backupTitle, isRTL && styles.textRTL]}>
                  {t('settings_backup')}
                </Text>
                <Text style={[styles.subtitle, isRTL && styles.textRTL]}>
                  {t('settings_backup_description')}
                </Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Premium')}
              style={[styles.premium, isRTL && styles.rowRTL]}
            >
              <Crown color={colors.yellow} size={30} />
              <View style={styles.copy}>
                <Text style={[styles.premiumTitle, isRTL && styles.textRTL]}>
                  {premium
                    ? t('settings_premium_active')
                    : t('settings_go_premium')}
                </Text>
                <Text style={[styles.premiumSubtitle, isRTL && styles.textRTL]}>
                  {premium
                    ? t('settings_premium_active_description')
                    : t('settings_premium_description')}
                </Text>
              </View>
            </Pressable>
            <Text style={[styles.section, isRTL && styles.textRTL]}>
              {t('settings_title')}
            </Text>
          </>
        }
        ListFooterComponent={
          <Text style={[styles.version, isRTL && styles.centeredTextRTL]}>
            {t('settings_version')}
          </Text>
        }
      />
    </ScreenContainer>
  );
}
