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
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingRight: 36,
  },
  inputFocused: {
    borderColor: COLORS.cadCaixaPreferenciasBorda,
  },
  inputError: {
    borderColor: COLORS.buttonDangerBorder,
  },
  validIcon: {
    position: 'absolute',
    right: 12,
    top: 7,
    color: COLORS.buttonPositiveText,
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.buttonDangerText,
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    paddingLeft: 4,
  },
});
