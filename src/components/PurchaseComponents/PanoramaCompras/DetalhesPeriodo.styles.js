import { StyleSheet } from "react-native";
import { DASHBOARD_THEME } from "../../../constants/dashboardTheme";
const c = DASHBOARD_THEME.colors;
export const s = StyleSheet.create({
  tiles: {flexDirection: 'row', gap: 8, alignItems: 'stretch'},
  tile: {flex: 1, minWidth: 0, padding: 12, gap: 8, borderRadius: 16, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'flex-start', minHeight: 100},
  tileLabel: {fontSize: 12, lineHeight: 17, color: c.navy, textAlign: 'center', fontWeight: '600'},
  distribution: {flexDirection: 'row', borderRadius: 8, overflow: 'hidden', minHeight: 12, backgroundColor: c.track},
  dot: {width: 9, height: 9, borderRadius: 5},
  container: {
    gap: 20
  },
  period: {
    fontSize: 16,
    color: c.navy,
    lineHeight: 24,
    fontWeight: '600'
  },
  summary: {
    gap: 10
  },
  section: {
    gap: 14
  },
  highlight: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: c.accentSoft,
    gap: 10
  },
  title: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
    color: '#21116A'
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
  strong: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: c.navy
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between'
  },
  grow: {
    flex: 1,
    minWidth: 0
  },
  number: {
    fontSize: 23,
    fontWeight: '700',
    color: c.navy
  },
  count: {
    fontSize: 13,
    color: c.navy,
    flexShrink: 1
  },
  week: {
    flexDirection: 'row',
    gap: 6
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 6
  },
  track: {
    height: 64,
    width: 14,
    borderRadius: 7,
    backgroundColor: c.track,
    justifyContent: 'flex-end'
  },
  bar: {
    width: 14,
    borderRadius: 7,
    backgroundColor: c.navy
  },
  factor: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8
  },
  detail: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: c.accentSoft
  },
  toggle: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  }
});
