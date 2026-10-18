import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';

const { colors: T, spacing: S, radius: R } = DASHBOARD_THEME;

export const styles = StyleSheet.create({
  section: {
    marginVertical: 0,
  },

  body: {
    gap: S.sm,
  },

  state: {
    alignItems: 'center',
    gap: S.sm,
    paddingVertical: S.sm,
  },

  metricRow: {
    flexDirection: 'row',
    gap: S.sm,
  },

  metric: {
    flex: 1,
    minWidth: 0,
    minHeight: 78,
    justifyContent: 'center',
    padding: S.md,
    borderRadius: R.md,
    backgroundColor: T.surfaceMuted,
  },

  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },

  value: {
    flexShrink: 1,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '800',
    color: T.ink,
  },

  label: {
    marginTop: S.xs,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: T.body,
  },

  sectionHeading: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: T.ink,
  },

  note: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: T.body,
  },

  groupSection: {
    gap: S.xs,
  },

  category: {
    paddingVertical: S.sm,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },

  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.sm,
  },

  categoryName: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: T.ink,
  },

  progressTrack: {
    height: 8,
    marginTop: S.sm,
    overflow: 'hidden',
    borderRadius: R.pill,
    backgroundColor: T.track,
  },

  progressFill: {
    height: '100%',
    borderRadius: R.pill,
    backgroundColor: COLORS.dadoTres,
  },

  recommendation: {
    gap: S.sm,
    minHeight: 44,
    paddingHorizontal: S.md,
    paddingVertical: S.sm,
    borderRadius: R.md,
    backgroundColor: T.surfaceMuted,
  },

  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },

  recommendationTitle: {
    flex: 1,
  },

  moreButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    marginTop: S.xs,
    borderRadius: R.md,
    backgroundColor: T.surfaceMuted,
  },

  actionText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    color: T.navy,
  },

  retry: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: S.md,
    borderRadius: R.md,
    backgroundColor: T.surfaceMuted,
  },
});
