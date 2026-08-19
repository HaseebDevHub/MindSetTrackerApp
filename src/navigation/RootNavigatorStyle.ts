import { StyleSheet } from 'react-native';
import { colors, typography } from '../constants/theme';

const styles = StyleSheet.create({
  tabBar: {
    height: 66,
    paddingTop: 7,
    paddingBottom: 7,
    backgroundColor: '#1A1D24',
    borderTopColor: colors.divider,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default styles;
