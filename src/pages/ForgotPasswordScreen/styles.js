import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFEFF5',
  },
  logo: {
    width: 180,
    height: 180,
  },
  overlay: {
    width: '85%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderColor: '#E6BAD1',
    borderWidth: 2,
  },

  titulo: {
    fontFamily: 'SugoDisplay',
    fontSize: 50,
    color: '#595D7C',
    marginBottom: 10,
  },

  subtitulo: {
    color: '#595D7C',
    marginBottom: 15,
    textAlign: 'center',
  },

  input: {
    width: '100%',
    height: 45,
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 12,
    color: '#000',
  },

  button: {
    width: '100%',
    backgroundColor: '#595D7C',
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 5,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  texto:{
    color: '#000',
    fontSize: 16,
    fontStyle: 'bold',
    paddingBottom: 10,
  }
});