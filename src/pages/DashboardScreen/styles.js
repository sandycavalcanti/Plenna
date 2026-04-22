import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7FB',
  },

  topBar: {
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F7FB',
    borderBottomColor: '#e3dff891',
    borderBottomWidth: 1,
  },

  monthChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#D4AFCA',
  },

  monthChipText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },

  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7FB',
  },

  scroll: {
    flex: 1,
    backgroundColor: '#F7F7FB',
  },

  scrollContent: {
    paddingTop: 4,
  },
});
