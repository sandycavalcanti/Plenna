import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginVertical: 10,
  },

  valor: {
    fontSize: 36,
    color: COLORS.dashboardGastosGeraisValor,
    fontWeight: '600',
  },

  meta: {
    fontSize: 18,
  },

  metaValor: {
    color: COLORS.dashboardMetaValor,
  },

  excedente: {
    color: COLORS.dashboardGastosGeraisAviso,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 20,
  },

  chartContainer: {
    borderRadius: 16,
    padding: 10,
    marginTop: -60,
    marginBottom: -60,
  },
});
