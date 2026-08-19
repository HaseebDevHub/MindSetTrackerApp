import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  track: {
    flex: 1,
    flexDirection: 'row',
  },
  page: {
    flexGrow: 0,
    flexShrink: 0,
  },
});

export default styles;
