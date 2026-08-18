import {StyleSheet} from 'react-native';
import {colors, radii, spacing, typography} from '../../constants/theme';

const styles = StyleSheet.create({card: {minHeight: 84, borderRadius: radii.card, padding: spacing.large, flexDirection: 'row', alignItems: 'center', gap: spacing.medium}, checkbox: {width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.text, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center'}, copy: {flex: 1}, titleRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.small}, title: {...typography.bodyLarge, color: colors.text, flex: 1}, completedTitle: {textDecorationLine: 'line-through', color: '#D9E7FF'}, time: {...typography.caption, color: '#D9E7FF', marginTop: spacing.xs, letterSpacing: 0.5}, finished: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs}, finishedText: {...typography.caption, color: '#BFDBFE'}, menu: {width: 34, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center'}});

export default styles;
