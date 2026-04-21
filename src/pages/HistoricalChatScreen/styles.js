import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7FB',
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
    borderColor: 'rgba(131, 111, 226, 0.3)',
    backgroundColor: '#FFFFFF',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF1FF',
    borderWidth: 1,
    borderColor: 'rgba(131, 111, 226, 0.35)',
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
