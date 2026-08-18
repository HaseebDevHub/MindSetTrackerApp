import {StyleSheet} from 'react-native';
import {colors, typography} from '../../constants/theme';

const styles = StyleSheet.create({
  row: {minHeight: 52, flexDirection: 'row', alignItems: 'center'},
  side: {width: 44, minHeight: 44, justifyContent: 'center'},
  right: {alignItems: 'flex-end'},
  title: {...typography.bodyLarge, flex: 1, color: colors.text, textAlign: 'center', letterSpacing: 1},
});

export default styles;
