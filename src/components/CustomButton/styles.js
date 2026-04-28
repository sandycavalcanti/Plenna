import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

export const styles = StyleSheet.create({
  button: {
    width: '55%',
    backgroundColor: COLORS.customButtonFundo,
    borderRadius: 30,
    padding: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: COLORS.customButtonTexto,
    fontSize: 16,
  },
});
