import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    backgroundColor: COLORS.dashboardAlertaCardFundo,
    borderRadius: 20,
    padding: 18,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dashboardAlertaCardTitulo,
  },

  text: {
    fontSize: 15,
    marginTop: 4,
    color: COLORS.dashboardAlertaCardTexto,
  },

  highlight: {
    color: COLORS.dashboardAlertaCardDestaque,
    fontWeight: 'bold',
  },

  recomendacao: {
    marginTop: 10,
    color: COLORS.dashboardAlertaCardRecomendacao,
    fontWeight: '600',
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#BBBBBB',
    marginHorizontal: 4,
  },

  dotActive: {
    backgroundColor: '#4B3F72',
    width: 10,
    height: 10,
  },
});
