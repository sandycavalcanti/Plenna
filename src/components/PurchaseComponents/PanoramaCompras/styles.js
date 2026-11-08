import { StyleSheet } from "react-native";
import { DASHBOARD_THEME } from "../../../constants/dashboardTheme";
const c = DASHBOARD_THEME.colors;
export const s = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 20,
    backgroundColor: c.surface,
    gap: 12,
    marginBottom: 12
  },
  week: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-end'
  },
  day: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 4
  },
  dayTrack: {
    height: 54,
    width: 12,
    backgroundColor: c.track,
    borderRadius: 6,
    justifyContent: 'flex-end'
  },
  dayFill: {
    width: 12,
    borderRadius: 6,
    backgroundColor: c.navy
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  copy: {
    flex: 1,
    minWidth: 0
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    color: c.ink,
    flexShrink: 1
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: c.ink,
    flexShrink: 1
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    color: c.navy
  },
  strong: {
    fontSize: 14,
    fontWeight: '600',
    color: c.navy,
    flexShrink: 1
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  metric: {
    flex: 1,
    minWidth: 100,
    borderRadius: 14,
    backgroundColor: c.accentSoft,
    padding: 12,
    gap: 5
  },
  number: {
    fontSize: 26,
    fontWeight: '700',
    color: c.navy
  },
  link: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: c.navy,
    flexShrink: 1
  },
  action: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  screen: {
    flex: 1,
    backgroundColor: c.surface
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8
  },
  close: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    padding: 16,
    gap: 8
  },
  indicador: {
    gap: 6,
    paddingVertical: 4
  },
  track: {
    height: 8,
    borderRadius: 8,
    backgroundColor: c.track,
    overflow: 'hidden'
  },
  fill: {
    height: 8,
    borderRadius: 8,
    backgroundColor: c.navy
  },
  reflection: {
    backgroundColor: c.accentSoft
  }
});
