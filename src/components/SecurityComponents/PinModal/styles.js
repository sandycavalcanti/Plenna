import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(27, 32, 70, 0.35)',
  },
  keyboardAvoiding: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    backgroundColor: COLORS.cadModalContainerFundo,
    alignItems: 'center',
  },
  title: {
    color: COLORS.cadTitulo,
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.perfilInfoValor,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    minHeight: 48,
    alignItems: 'center',
  },
  pinEntry: {
    width: '100%',
    minHeight: 48,
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 10,
  },
  indicator: {
    color: COLORS.cadTitulo,
    fontSize: 27,
    lineHeight: 32,
  },
  input: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 48,
    opacity: 0.02,
    padding: 0,
    color: 'transparent',
    textAlign: 'center',
  },
  error: {
    minHeight: 38,
    color: '#D64545',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  cancel: {
    marginTop: 12,
    padding: 10,
  },
  cancelText: {
    color: COLORS.loginLinks,
    fontSize: 15,
  },
});
