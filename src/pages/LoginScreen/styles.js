import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.loginFundo,
  },
  overlay: {
    width: '85%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingTop: 15,
  },
  logo: {
    width: 180,
    height: 180,
  },
  titulo: {
    fontSize: 24,
    marginBottom: 5,
    fontFamily: 'SugoDisplay',
    fontSize: 60,
    color: COLORS.loginTitulo,
  },
  texto: {
    marginTop: 6,
  },
});
