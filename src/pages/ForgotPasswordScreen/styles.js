import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cadFundo,
  },
  logo: {
    width: 150,
    height: 150,
  },
  overlay: {
    width: '85%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 30,
    paddingHorizontal: 15,
  },

  titulo: {
    fontFamily: 'SugoDisplay',
    fontSize: 50,
    color: COLORS.cadTitulo,
    marginBottom: 10,
  },

  input: {
    width: '100%',
    height: 45,
    backgroundColor: COLORS.cadTextInputFundo,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 12,
    color: COLORS.cadTextInputTexto,
  },

  link: {
    marginTop: 10,
    color: '#BD4E4E',
  },

  stepIndicator: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  stepCircle: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff50',
    marginHorizontal: 5,
  },
  stepCircleActive: {
    backgroundColor: '#E6BAD1',
  },
  texto: {
    color: '#000',
    fontSize: 16,
    fontStyle: 'bold',
    paddingBottom: 10,
  },
});
