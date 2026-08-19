import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Heart } from 'lucide-react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { AppInput } from '../../components/common/AppInput';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useTheme } from '../../context/ThemeContext';
import type { MeStackParamList } from '../../types/models';
import useStyles from './MeScreenStyle';

type Props = NativeStackScreenProps<MeStackParamList, 'Feedback'>;

export function FeedbackScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <ScreenContainer>
        <AppHeader title="FEEDBACK" onBack={navigation.goBack} />
        <View style={styles.sent}>
          <View style={styles.sentIcon}>
            <Heart color={colors.onPrimary} fill={colors.onPrimary} size={34} />
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
  }
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
