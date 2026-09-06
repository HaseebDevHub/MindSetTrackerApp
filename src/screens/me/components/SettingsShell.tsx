import React from 'react';
import { ScrollView, View } from 'react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { useTranslation } from '../../../localization';
import useStyles from '../MeScreenStyle';

export function SettingsShell({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  const { isRTL } = useTranslation();
  return (
    <ScreenContainer padded={false}>
      <View style={styles.headerPad}>
        <AppHeader title={title} onBack={onBack} isRTL={isRTL} />
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
