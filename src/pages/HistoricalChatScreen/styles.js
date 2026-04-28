import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fundoPrincipal,
  },
  search: {
    paddingTop: 54,
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.histChatTextInputBorda,
    backgroundColor: COLORS.histChatTextInputFundo,
    color: COLORS.histChatTextInputTexto,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.histChatBotao3PontosFundo,
    borderWidth: 1,
    borderColor: COLORS.histChatBotao3PontosBorda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
});
