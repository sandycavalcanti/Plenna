import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

export default StyleSheet.create({
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.buttonSecondaryBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryItemAttention: {
    backgroundColor: COLORS.buttonPositiveBackground,
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: COLORS.surface,
  },
  label: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: COLORS.dadoUm,
  },
  value: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: COLORS.cadTitulo,
  },
  categoriesSection: {
    marginTop: 2,
  },
  categoriesTitle: {
    marginBottom: 4,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.cadTitulo,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryName: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.dadoUm,
  },
  categoryValue: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.cadTitulo,
  },
  emptyText: {
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.dadoUm,
  },
});
