import { StyleSheet } from "react-native";
import { DASHBOARD_THEME } from "../../constants/dashboardTheme";
const c = DASHBOARD_THEME.colors;
export const s = StyleSheet.create({
  container: {
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12
  },
  modes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 3,
    gap: 3,
    borderRadius: 16,
    backgroundColor: c.accentSoft
  },
  mode: {
    flexGrow: 1,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13
  },
  selected: {
    backgroundColor: c.navy
  },
  modeText: {
    color: c.ink,
    fontSize: 14,
    textAlign: 'center'
  },
  selectedText: {
    color: c.surface,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center'
  },
  interval: {
    gap: 8
  },
  dates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  date: {
    flexGrow: 1,
    minHeight: 54,
    padding: 10,
    gap: 4,
    borderRadius: 14,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    color: c.ink
  },
  value: {
    fontSize: 14,
    color: c.ink,
    fontWeight: '600'
  },
  apply: {
    minHeight: 48,
    padding: 12,
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: c.navy
  },
  history: {
    fontSize: 13,
    lineHeight: 19,
    color: c.ink,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  error: {
    color: '#B32646',
    fontSize: 13,
    lineHeight: 19
  }
});
