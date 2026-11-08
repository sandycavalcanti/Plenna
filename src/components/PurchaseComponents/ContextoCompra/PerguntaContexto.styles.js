import { StyleSheet } from "react-native";
import { DASHBOARD_THEME } from "../../../constants/dashboardTheme";
const c = DASHBOARD_THEME.colors;
export const styles = StyleSheet.create({
  questionBody: {
    gap: 12
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  caption: {
    fontSize: 13,
    lineHeight: 19,
    color: c.ink,
    flexShrink: 1
  },
  badge: {
    fontSize: 12,
    color: c.navy,
    backgroundColor: c.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: DASHBOARD_THEME.radius.pill
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: c.border,
    overflow: 'hidden'
  },
  fill: {
    height: 4,
    backgroundColor: c.navy
  },
  question: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '700',
    color: c.ink,
    marginTop: 6,
    marginBottom: 4
  },
  options: {
    gap: 8
  },
  option: {
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: DASHBOARD_THEME.radius.md,
    backgroundColor: c.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  selected: {
    borderColor: c.navy,
    backgroundColor: c.accentSoft
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: c.ink
  },
  selectedText: {
    fontWeight: '600'
  },
  pressed: {
    opacity: 0.75
  },
  reassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 2,
    backgroundColor: c.background,
    borderTopWidth: 1,
    borderTopColor: c.border
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10
  },
  previous: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    borderRadius: DASHBOARD_THEME.radius.md,
    borderWidth: 1,
    borderColor: c.border
  },
  primary: {
    flex: 1,
    minHeight: 50,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: DASHBOARD_THEME.radius.md,
    backgroundColor: c.navy
  },
  primaryText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: c.surface,
    textAlign: 'center',
    flexShrink: 1
  },
  textAction: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  link: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: c.navy
  },
  secondaryText: {
    fontSize: 13,
    lineHeight: 19,
    color: c.ink
  },
  disabled: {
    opacity: 0.5
  }
});
