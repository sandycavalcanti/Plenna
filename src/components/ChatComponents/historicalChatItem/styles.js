import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(131, 111, 226, 0.2)',
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
    color: '#2F356B',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    color: '#6D74A8',
    fontSize: 13,
    marginTop: 4,
  },
  menuButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF1FF',
    marginLeft: 10,
  },
  menuText: {
    color: '#4652A4',
    fontSize: 18,
  },
});
