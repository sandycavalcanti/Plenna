import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.histChatItemFundo,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.histChatItemBorda,
    borderRadius: 14,
    marginBottom: 10,
  },
  chatArea: {
    flex: 1,
  },
  chatInfo: {
    flexDirection: 'column',
  },
  title: {
    color: COLORS.histChatItemTitulo,
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    color: COLORS.histChatItemMensagem,
    fontSize: 13,
    marginTop: 4,
  },
  menuButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.histChatItemBotao3PontosFundo,
    marginLeft: 10,
  },
});
