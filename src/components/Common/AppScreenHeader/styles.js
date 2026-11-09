import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';
import { TYPOGRAPHY } from '../../../constants/typography';

export default StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 10,
  },
  backButton: {
    width: 44,
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.buttonGhostPressed,
    borderWidth: 1,
    borderColor: COLORS.buttonOutlineBorder,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cadCaixaPreferenciasValorFundo,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    color: COLORS.cadTitulo,
    ...TYPOGRAPHY.screenTitle,
  },
  subtitle: {
    color: COLORS.dadoUm,
    ...TYPOGRAPHY.screenSubtitle,
  },
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
