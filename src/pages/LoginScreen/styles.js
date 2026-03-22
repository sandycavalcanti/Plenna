import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(89, 93, 124, 0.84)',
  },  
  overlay: {
    width: '85%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingTop: 20,
    padding: 10,
    borderColor: '#E6BAD1',
    borderRadius: 30,
    borderWidth: 2,
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
    color: '#E6BAD1',
  },
  texto: {
    marginTop: 6
  }
});