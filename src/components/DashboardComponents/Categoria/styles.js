import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginVertical: 10,
  },

  content: {
    width: '100%',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  legendText: {
    fontSize: 16,
    color: '#333',
  },
});
