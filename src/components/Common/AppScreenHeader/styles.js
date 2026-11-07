import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';

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
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.customTextInputFundo,
    borderWidth: 1,
    borderColor: 'rgba(131, 111, 226, 0.12)',
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
    fontFamily: 'SugoDisplay',
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '500',
  },
  subtitle: {
    color: COLORS.dadoUm,
    fontSize: 13,
    lineHeight: 18,
  },
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
