import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';

// O card reutiliza o padrão branco/borda suave já empregado nos componentes do app.
export const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(131, 111, 226, 0.2)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingRight: 12,
    gap: 4,
  },
  establishment: {
    color: COLORS.histChatItemTitulo,
    fontSize: 17,
    fontWeight: '700',
  },
  date: {
    color: COLORS.histChatItemMensagem,
    fontSize: 13,
  },
  value: {
    color: COLORS.dashboardGastosGeraisValor,
    fontSize: 19,
    fontWeight: '700',
    marginTop: 2,
  },
  metadataRow: {
    gap: 2,
    marginTop: 4,
  },
  metadata: {
    color: COLORS.dadoUm,
    fontSize: 12,
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF1FF',
  },
});
