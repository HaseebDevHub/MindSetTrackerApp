import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: { flex: 1 },
  bootstrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  bootstrapTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  bootstrapMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    minWidth: 180,
  },
});

export default styles;
