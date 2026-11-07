import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export default StyleSheet.create({
  container: {
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  identityRow: {
    position: 'relative',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    flexShrink: 0,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.buttonSecondaryBackground,
    borderWidth: 1,
    borderColor: COLORS.buttonOutlineBorder,
  },
  initials: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.metaProgressFill,
  },
  identityCopy: {
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    gap: 3,
  },
  name: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    color: COLORS.cadTitulo,
    textAlign: 'center',
  },
  email: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.dadoUm,
    textAlign: 'center',
  },
  muted: {
    fontSize: 13,
    color: COLORS.dadoUm,
    textAlign: 'center',
  },
  action: {
    position: 'absolute',
    top: -8,
    right: -4,
    zIndex: 2,
  },
});
