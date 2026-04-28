import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.splashFundo,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 380,
    height: 380,
    marginBottom: 20,
  },
});