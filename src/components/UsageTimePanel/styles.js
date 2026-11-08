import { StyleSheet } from 'react-native';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';
const {
  colors,
  spacing,
  radius
} = DASHBOARD_THEME;
export const styles = StyleSheet.create({
  section: {
    marginHorizontal: 0,
    marginVertical: 6
  },
  compactSection: {
    marginHorizontal: 18,
    marginVertical: spacing.md
  },
  summary: {
    gap: spacing.xs
  },
  todaySummary: {
    backgroundColor: '#EEE7FB',
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm
  },
  total: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums']
  },
  compactTotal: {
    fontSize: 38
  },
  caption: {
    color: colors.body,
    fontSize: 13,
    flexShrink: 1
  },
  todayCaption: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  status: {
    color: colors.body,
    fontSize: 12,
    lineHeight: 18,
    flexShrink: 1
  },
  featuredName: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '800',
    flexShrink: 1
  },
  compactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm
  },
  topCopy: {
    flex: 1,
    gap: spacing.xs
  },
  durationPill: {
    color: colors.navy,
    backgroundColor: '#F6F1FB',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    flexShrink: 1
  },
  chart: {
    gap: spacing.lg,
    paddingTop: spacing.sm
  },
  chartTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700'
  },
  barItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  barCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm
  },
  barHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm
  },
  barLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    flex: 1
  },
  percent: {
    color: colors.muted,
    fontSize: 12,
    fontVariant: ['tabular-nums']
  },
  barValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
    textAlign: 'right'
  },
  barTrack: {
    height: 10,
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.track
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.pill
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  updated: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    flexShrink: 1
  },
  details: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  action: {
    minHeight: 48,
    justifyContent: 'center',
    alignSelf: 'flex-start'
  },
  actionText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '600'
  }
});
