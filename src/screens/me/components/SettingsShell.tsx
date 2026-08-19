import React from 'react';
import { ScrollView, View } from 'react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
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
  return (
    <ScreenContainer padded={false}>
      <View style={styles.headerPad}>
        <AppHeader title={title} onBack={onBack} />
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
