import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export default StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 5,
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: COLORS.dadoUm,
  },
  value: {
    flex: 1.5,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.cadTitulo,
    textAlign: 'right',
  },
});
