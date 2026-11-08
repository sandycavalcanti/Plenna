import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cadFundo,
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  overlay: {
    width: '85%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingTop: 18,
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
    color: COLORS.cadTitulo,
  },
  texto: {
    marginTop: 6,
  },
  signupLink: {
    marginTop: 14,
  },
});
