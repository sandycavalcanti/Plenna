import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.chatFundo,
  },

  keyboardWrapper: {
    flex: 1,
  },

  header: {
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.chatHeaderFundo,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.chatHeaderBorda,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.chatIconeRoboFundo,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.chatIconeRoboBorda,
    marginRight: 10,
  },

  headerTitle: {
    color: COLORS.chatDestinatarioNome,
    fontSize: 16,
    fontWeight: '600',
  },

  headerSubtitle: {
    marginTop: 1,
    color: COLORS.chatDestinatarioStatus,
    fontSize: 12,
  },

  headerAction: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.chatBotao3PontosFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: {
    flex: 1,
  },

  messages: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 18,
  },

  messageRow: {
    width: '100%',
    marginBottom: 12,
  },

  messageRowAi: {
    alignItems: 'flex-start',
  },

  messageRowUser: {
    alignItems: 'flex-end',
  },

  message: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    maxWidth: '82%',
  },

  userMessage: {
    backgroundColor: COLORS.chatRemetenteMensagemFundo,
    borderBottomRightRadius: 6,
    shadowColor: COLORS.chatRemetenteMensagemBorda,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  aiMessage: {
    backgroundColor: COLORS.chatDestinatarioMensagemFundo,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.chatDestinatarioMensagemBorda,
  },

  messageText: {
    color: COLORS.chatDestinatarioMensagemTexto,
    fontSize: 14,
    lineHeight: 20,
  },

  userMessageText: {
    color: COLORS.chatRemetenteMensagemTexto,
  },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 0,
    paddingTop: 8,
    paddingHorizontal: 12,
    // keep spacing between children but let RN handle gaps via margins
    gap: 8,
    backgroundColor: COLORS.chatContainerEnviarFundo,
    borderWidth: 1,
    borderColor: COLORS.chatContainerEnviarBorda,
    borderRadius: 12,
    shadowColor: COLORS.chatContainerEnviarSombra,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.chatBotoesAdicionaisEnviarFundo,
  },

  chatInput: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginBottom: 0,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.chatTextInputBorda,
    backgroundColor: COLORS.chatTextInputFundo,
    color: COLORS.chatTextInputTexto,
  },

  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.chatBotaoEnviarFundo,
  },
});
