import { StyleSheet } from "react-native";
import { DASHBOARD_THEME } from "../../../constants/dashboardTheme";
const c = DASHBOARD_THEME.colors;
export const styles = StyleSheet.create({
  list: {
    gap: 10
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    borderLeftWidth: 3,
    borderLeftColor: c.accentSecondary,
    overflow: 'hidden'
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 3
  },
  date: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: c.ink
  },
  badge: {
    fontSize: 11,
    lineHeight: 16,
    color: c.navy,
    backgroundColor: c.accentSoft,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 1
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: c.border
  },
  values: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    color: c.ink,
    flexGrow: 1,
    flexShrink: 1
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
    color: c.navy,
    fontWeight: '600',
    flexShrink: 1
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    color: c.navy
  },
  title: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: c.ink,
    marginTop: 8
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    color: c.ink
  },
  preview: {
    fontSize: 14,
    lineHeight: 21,
    color: c.ink,
    paddingHorizontal: 12,
    paddingBottom: 12
  },
  highlight: {
    backgroundColor: c.accentSoft,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    gap: 4
  },
  action: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 8
  },
  link: {
    fontSize: 14,
    lineHeight: 21,
    color: c.navy,
    fontWeight: '600'
  }
});
