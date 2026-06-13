import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

export const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    minWidth: 0,
    height: 40,
    backgroundColor: COLORS.customTextInputFundo,
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingRight: 36,
  },
  validIcon: {
    position: 'absolute',
    right: 12,
    top: 10,
    color: '#2F9E44',
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: '#D64545',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    paddingLeft: 4,
  },
});
