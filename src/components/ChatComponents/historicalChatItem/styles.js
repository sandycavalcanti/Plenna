import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

  container: {
    width: '100%',
    backgroundColor: '#ffffff20',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: '#ffffff',
    borderBottomWidth: 0.5,
  },
  chatArea: {
    flex: 1,
  },
  chatInfo: {
    flexDirection: 'column',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    color: '#ddd',
    fontSize: 14,
    marginTop: 2,
  },
  menuText: {
    color: '#fff',
    fontSize: 18,
  },

});