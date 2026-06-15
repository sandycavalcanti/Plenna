import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fundoPrincipal,
  },
  search: {
    paddingTop: 10,
    paddingBottom: 5,
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
    height: 40,
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
