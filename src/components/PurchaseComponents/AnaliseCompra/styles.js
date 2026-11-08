import { StyleSheet } from 'react-native';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';
const c = DASHBOARD_THEME.colors;
export const styles = StyleSheet.create({
  updates: {
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: c.border
  },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  content: {
    gap: 16
  },
  hero: {
    backgroundColor: c.accentSoft,
    borderRadius: 20,
    padding: 18,
    gap: 12
  },
  answer: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    flexGrow: 1
  },
  answerSelected: {
    backgroundColor: c.accentSoft,
    borderColor: c.navy
  },
  classification: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  title: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    color: c.ink,
    flexShrink: 1
  },
  result: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: c.ink
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: c.ink
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    color: c.navy
  },
  section: {
    gap: 10
  },
  factors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  factor: {
    flexGrow: 1,
    flexBasis: 110,
    padding: 12,
    gap: 6,
    borderRadius: 14,
    backgroundColor: c.surface
  },
  factorLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: c.ink
  },
  factorValue: {
    fontSize: 14,
    lineHeight: 20,
    color: c.navy,
    fontWeight: '600'
  },
  reflection: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border
  },
  copy: {
    flex: 1,
    gap: 5,
    minWidth: 0
  },
  link: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: c.navy
  },
  action: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface
  },
  detailsButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border
  },
  disabled: {
    opacity: 0.5
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(32,26,54,0.32)',
    justifyContent: 'flex-end',
    zIndex: 20
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingHorizontal: 18,
    paddingBottom: 16
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.border,
    alignSelf: 'center',
    marginTop: 10
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8
  },
  sheetTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '700',
    color: c.ink
  },
  close: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetContent: {
    gap: 18,
    paddingBottom: 12
  },
  group: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: 16
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6
  },
  rowLabel: {
    flexGrow: 1,
    flexBasis: 130,
    fontSize: 14,
    lineHeight: 21,
    color: c.ink
  },
  rowValue: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: c.ink,
    flexShrink: 1
  },
  difference: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: c.accentSoft,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: c.navy
  },
  subheading: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: c.ink
  },
  trace: {
    gap: 8
  }
});
