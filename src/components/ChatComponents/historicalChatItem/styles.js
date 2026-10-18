import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 72,
    marginBottom: 10,
    paddingLeft: 13,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.histChatItemBorda,
    borderRadius: 14,
    backgroundColor: COLORS.histChatItemFundo,
  },
  contentButton: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatIcon: {
    width: 38,
    height: 38,
    marginRight: 11,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.chatIconeRoboFundo,
    borderWidth: 1,
    borderColor: COLORS.chatIconeRoboBorda,
  },
  chatInfo: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: COLORS.histChatItemTitulo,
    fontSize: 16,
    fontWeight: '700',
  },
  message: {
    marginTop: 4,
    color: COLORS.histChatItemMensagem,
    fontSize: 12,
  },
  deleteButton: {
    width: 44,
    height: 44,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
