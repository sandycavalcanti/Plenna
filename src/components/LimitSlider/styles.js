import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 5,
  },
  containerCompact: {
    marginVertical: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.cadCaixaPreferenciasTitulo,
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  titleCompact: {
    fontSize: 15,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginRight: 12,
  },
  sliderCompact: {
    height: 28,
    marginRight: 8,
  },
  valuePill: {
    backgroundColor: COLORS.cadCaixaPreferenciasValorFundo,
    borderRadius: 999,
    minWidth: 124,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valuePillCompact: {
    minWidth: 74,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  valueText: {
    color: COLORS.cadCaixaPreferenciasValorTexto,
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '700',
    padding: 0,
  },
  valueTextCompact: {
    fontSize: 16,
  },
  moneyRow: {
    flexDirection: 'column-reverse',
    alignItems: 'stretch',
  },
  moneySlider: {
    flex: 0,
    width: '100%',
    height: 44,
    marginRight: 0,
  },
  moneyPill: {
    borderRadius: 10,
    alignItems: 'stretch',
  },
  moneyFocused: {
    borderColor: COLORS.cadCaixaPreferenciasTitulo,
  },
  moneyInput: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 8,
    fontSize: 18,
  },
  inputError: {
    color: COLORS.loginEsqueciSenha,
    fontSize: 12,
    maxWidth: 180,
  },
});
