import { StyleSheet } from 'react-native';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';
const {
  colors: c,
  spacing: s,
  radius: r
} = DASHBOARD_THEME;
// Padrões compartilhados pelo resumo, gerenciamento e linha do tempo da compra.
export const purchaseStyles = StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: r.md,
    padding: s.md,
    gap: s.sm,
    marginBottom: s.md
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm
  },
  copy: {
    flex: 1,
    minWidth: 0
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: r.sm,
    backgroundColor: c.accentSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    color: c.ink,
    fontSize: 15,
    fontWeight: '600'
  },
  body: {
    color: c.ink,
    fontSize: 14,
    lineHeight: 21
  },
  caption: {
    color: c.body,
    fontSize: 13,
    lineHeight: 19
  },
  value: {
    color: c.ink,
    fontSize: 18,
    fontWeight: '700'
  },
  hero: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '700',
    color: c.ink
  },
  sectionHeading: {
    flexDirection: 'row',
    gap: s.sm,
    alignItems: 'center',
    marginBottom: s.xs
  },
  factorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.sm
  },
  factor: {
    flexGrow: 1,
    flexBasis: 85,
    backgroundColor: c.accentSoft,
    borderRadius: r.sm,
    padding: s.md,
    gap: s.xs,
    alignItems: 'center'
  },
  badge: {
    backgroundColor: c.surfaceMuted,
    borderRadius: r.pill,
    paddingHorizontal: s.sm,
    paddingVertical: s.xs,
    color: c.navy,
    fontSize: 13,
    fontWeight: '600'
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    minHeight: 64,
    paddingVertical: s.sm,
    borderBottomWidth: 1,
    borderBottomColor: c.border
  },
  action: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: s.sm
  },
  actionText: {
    color: c.navy,
    fontSize: 13,
    fontWeight: '600'
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    paddingVertical: s.sm
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.sm,
    marginVertical: s.sm
  },
  chip: {
    minHeight: 48,
    paddingHorizontal: s.md,
    justifyContent: 'center',
    borderRadius: r.sm,
    backgroundColor: c.surfaceMuted
  },
  selected: {
    backgroundColor: c.accentSoft,
    borderWidth: 1,
    borderColor: c.accentSecondary
  },
  event: {
    borderLeftWidth: 1,
    borderLeftColor: c.accentSecondary,
    paddingLeft: s.md,
    paddingVertical: s.sm,
    marginLeft: s.sm,
    gap: 3
  }
});
