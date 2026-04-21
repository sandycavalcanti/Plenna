import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF2FF',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(131, 111, 226, 0.16)',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF1FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(131, 111, 226, 0.35)',
    marginRight: 10,
  },

  headerTitle: {
    color: '#4652A4',
    fontSize: 16,
    fontWeight: '600',
  },

  headerSubtitle: {
    marginTop: 1,
    color: '#7D84B3',
    fontSize: 12,
  },

  headerAction: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F5F6FF',
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
    backgroundColor: '#4652A4',
    borderBottomRightRadius: 6,
    shadowColor: '#4652A4',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  aiMessage: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(131, 111, 226, 0.25)',
  },

  messageText: {
    color: '#2F356B',
    fontSize: 14,
    lineHeight: 20,
  },

  userMessageText: {
    color: '#FFFFFF',
  },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 0,
    paddingTop: 8,
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(131, 111, 226, 0.2)',
    borderRadius: 0,
    shadowColor: '#1E245A',
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
    backgroundColor: '#F7F8FF',
  },

  chatInput: {
    flex: 1,
    marginBottom: 0,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(131, 111, 226, 0.18)',
    backgroundColor: '#FFFFFF',
  },

  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4652A4',
  },
});
