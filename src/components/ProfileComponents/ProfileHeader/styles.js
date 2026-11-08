import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export default StyleSheet.create({
  container: {
    marginBottom: 14,
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 8,
  },
  identityRow: {
    position: 'relative',
    alignItems: 'center',
  },
  avatar: {
    width: 86,
    height: 86,
    flexShrink: 0,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.buttonSecondaryBackground,
    borderWidth: 1,
    borderColor: COLORS.buttonOutlineBorder,
  },
  initials: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.metaProgressFill,
  },
  identityCopy: {
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
  },
  name: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    color: COLORS.cadTitulo,
    textAlign: 'center',
  },
  action: {
    position: 'absolute',
    top: -8,
    right: -4,
    zIndex: 2,
  },
});
