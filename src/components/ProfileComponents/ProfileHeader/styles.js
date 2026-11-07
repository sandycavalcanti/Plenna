import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export default StyleSheet.create({
  container: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    flexShrink: 0,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.buttonSecondaryBackground,
  },
  initials: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.metaProgressFill,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  name: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    color: COLORS.cadTitulo,
  },
  email: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.dadoUm,
  },
  muted: {
    fontSize: 13,
    color: COLORS.dadoUm,
  },
  action: {
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
});
