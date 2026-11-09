import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  message: {
    flex: 1,
    marginLeft: 9,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  action: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  dismiss: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    borderRadius: 16,
  },
});
