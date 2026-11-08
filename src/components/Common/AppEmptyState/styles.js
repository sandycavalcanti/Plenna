import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';

export default StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 22,
    gap: 8,
  },
  compact: {
    paddingVertical: 10,
    paddingHorizontal: 0,
    gap: 5,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compactIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
  },
  circleIconWrap: {
    borderRadius: 999,
    backgroundColor: COLORS.buttonSecondaryBackground,
    borderWidth: 0,
  },
  title: {
    color: COLORS.cadTitulo,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    color: COLORS.dadoUm,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 320,
  },
  action: {
    width: 'auto',
    minWidth: 150,
    marginTop: 4,
  },
});
