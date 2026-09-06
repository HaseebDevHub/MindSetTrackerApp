import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Heart } from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { AppInput } from '../../components/common/AppInput';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../localization';
import type { MeStackParamList } from '../../types/models';
import useStyles from './MeScreenStyle';

type Props = NativeStackScreenProps<MeStackParamList, 'Feedback'>;

export function FeedbackScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { isRTL, t } = useTranslation();
  const styles = useStyles();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <ScreenContainer>
        <AppHeader
          title={t('feedback_title')}
          onBack={navigation.goBack}
          isRTL={isRTL}
        />
        <View style={styles.sent}>
          <View style={styles.sentIcon}>
            <Heart color={colors.onPrimary} fill={colors.onPrimary} size={34} />
          </View>
          <Text style={[styles.sentTitle, isRTL && styles.centeredTextRTL]}>
            {t('feedback_thanks')}
          </Text>
          <Text style={[styles.sentText, isRTL && styles.centeredTextRTL]}>
            {t('feedback_saved_preview')}
          </Text>
          <AppButton
            title={t('common_done')}
            onPress={navigation.goBack}
            style={styles.done}
          />
        </View>
      </ScreenContainer>
    );
  }
  return (
    <ScreenContainer keyboard>
      <AppHeader
        title={t('feedback_title')}
        onBack={navigation.goBack}
        isRTL={isRTL}
      />
      <Text style={[styles.feedbackTitle, isRTL && styles.textRTL]}>
        {t('feedback_help')}
      </Text>
      <Text style={[styles.settingsIntro, isRTL && styles.textRTL]}>
        {t('feedback_description')}
      </Text>
      <AppInput
        multiline
        value={message}
        onChangeText={setMessage}
        placeholder={t('feedback_placeholder')}
        maxLength={1000}
        style={isRTL ? styles.textRTL : undefined}
      />
      <Text style={[styles.character, isRTL && styles.characterRTL]}>
        {message.length}/1000
      </Text>
      <AppButton
        title={t('feedback_send')}
        disabled={!message.trim()}
        onPress={() => setSent(true)}
        style={styles.send}
      />
    </ScreenContainer>
  );
}
