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
  },
  valueTextCompact: {
    fontSize: 16,
  },
});
