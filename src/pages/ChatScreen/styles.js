import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#27273e',
  },

  header: {
    paddingTop: 50,
    paddingBottom: 15,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ffffff94',
  },

  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  messages: {
    padding: 15,
  },

  message: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '75%',
  },

  userMessage: {
    backgroundColor: '#595D7C',
    alignSelf: 'flex-end',
  },

  aiMessage: {
    backgroundColor: '#2F3244',
    alignSelf: 'flex-start',
  },

  messageText: {
    color: '#fff',
  },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#ffffff94',
  },

  chatInput: {
    flex: 1,
  },

});