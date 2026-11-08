import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';
const {
  colors: T,
  spacing: S,
  radius: R,
  shadows: SH
} = DASHBOARD_THEME;
export const styles = StyleSheet.create({
financialSummaryCard: {
    marginBottom: 12,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 13,
    borderRadius: R.md,
    backgroundColor: T.surface,
    ...SH.card
  },
financialSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
financialSummaryEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: T.muted,
    textTransform: 'uppercase'
  },
financialSummaryLabel: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '800',
    color: T.ink
  },
financialSummaryValue: {
    marginTop: 9,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '800',
    letterSpacing: -0.7,
    color: T.ink
  },
financialBars: {
    marginTop: 15
  },
financialBarRow: {
    marginTop: 9
  },
financialBarHeader: {
    gap: 3
  },
financialBarLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: T.body
  },
financialBarValue: {
    fontSize: 13,
    fontWeight: '800',
    color: T.ink
  },
financialBarTrack: {
    height: 11,
    marginTop: 8,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: R.pill,
    backgroundColor: T.track
  },
financialBarFill: {
    height: '100%',
    borderRadius: R.pill,
    backgroundColor: T.accent
  },
financialSummaryPercentBlock: {
    maxWidth: '40%',
    alignItems: 'flex-end'
  },
financialSummaryPercentValue: {
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '800'
  },
financialSummaryPercentLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: T.muted,
    textAlign: 'right'
  },
noLimitText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: T.muted
  },
retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.customButtonFundo
  }
});
