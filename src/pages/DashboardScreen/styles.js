import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';

const { colors: T, spacing: S, radius: R, shadows: SH } = DASHBOARD_THEME;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.background,
  },

  header: {
    paddingHorizontal: S.lg,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.background,
  },

  brandBlock: {
    flex: 1,
    paddingRight: 10,
  },

  brand: {
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '800',
    color: COLORS.perfilProfileCardTitulo,
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: T.muted,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.surface,
    ...SH.card,
  },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: S.lg,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.background,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 45,
    position: 'relative',
  },

  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: T.muted,
  },

  tabTextActive: {
    color: COLORS.perfilProfileCardTitulo,
    fontWeight: '800',
  },

  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    width: '62%',
    height: 3,
    borderRadius: 3,
    backgroundColor: COLORS.dadoDois,
  },

  pager: {
    flex: 1,
  },

  pageScroll: {
    flex: 1,
  },

  pageContent: {
    paddingTop: 18,
    paddingHorizontal: S.lg,
  },

  pageIntro: {
    marginBottom: 12,
  },

  pageEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: COLORS.dadoDois,
  },

  pageTitle: {
    marginTop: 4,
    fontFamily: 'SugoDisplay',
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '500',
    color: COLORS.perfilProfileCardTitulo,
  },

  pageSubtitle: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: T.body,
  },

  periodSelector: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: R.md,
    backgroundColor: T.surface,
    ...SH.card,
  },

  periodSelectorIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.sm,
    backgroundColor: T.accentSoft,
  },

  periodSelectorCopy: {
    flex: 1,
    marginLeft: 10,
  },

  periodSelectorLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: T.muted,
    textTransform: 'uppercase',
  },

  periodSelectorValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '800',
    color: T.ink,
  },

  heroCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: R.lg,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    ...SH.card,
  },

  heroCardWithin: {
    borderLeftWidth: 4,
    borderLeftColor: T.positive,
  },

  heroCardNear: {
    borderLeftWidth: 4,
    borderLeftColor: T.caution,
  },

  heroCardExceeded: {
    borderLeftWidth: 4,
    borderLeftColor: T.warning,
    backgroundColor: T.dangerSurface,
  },

  heroCardUndefined: {
    borderLeftWidth: 4,
    borderLeftColor: T.navy,
  },

  heroTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: T.muted,
  },

  heroPeriod: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: T.body,
  },

  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.accentSoft,
  },

  heroValue: {
    marginTop: 10,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '800',
    color: T.ink,
    letterSpacing: -0.8,
  },

  heroFacts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
  },

  heroFact: {
    flex: 1,
  },

  heroFactValue: {
    fontSize: 17,
    fontWeight: '800',
    color: T.ink,
  },

  heroFactLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: T.muted,
  },

  heroFactDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 16,
    backgroundColor: T.border,
  },

  budgetBlock: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },

  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  budgetHeaderCopy: {
    flex: 1,
  },

  budgetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: T.body,
  },

  budgetTarget: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '800',
    color: T.ink,
  },

  budgetValue: {
    fontSize: 12,
    fontWeight: '800',
    color: T.ink,
  },

  budgetTrack: {
    height: 8,
    marginTop: 9,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: T.track,
  },

  budgetFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: T.accent,
  },

  budgetStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
    gap: 5,
  },

  budgetStatusText: {
    fontSize: 12,
    fontWeight: '800',
  },

  budgetExcess: {
    marginLeft: 'auto',
    fontSize: 11,
    fontWeight: '700',
    color: T.warning,
  },

  budgetCaption: {
    marginTop: 7,
    fontSize: 11,
    fontWeight: '600',
    color: T.muted,
  },

  emptyPeriodBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    padding: 13,
    borderRadius: 15,
    backgroundColor: '#F0EDFA',
    borderWidth: 1,
    borderColor: '#E1DCF4',
  },

  emptyPeriodCopy: {
    flex: 1,
    marginLeft: 10,
  },

  emptyPeriodTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.perfilProfileCardTitulo,
  },

  emptyPeriodText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: '#777B96',
  },

  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 3,
  },

  metricTile: {
    width: '48.2%',
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderRadius: R.md,
    backgroundColor: T.surface,
    ...SH.card,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: T.border,
    borderRightColor: T.border,
    borderBottomColor: T.border,
  },

  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: R.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  metricCopy: {
    flex: 1,
    minWidth: 0,
  },

  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: T.muted,
  },

  metricValue: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: '800',
    color: T.ink,
  },

  metricCaption: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: T.muted,
  },

  stateCard: {
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 22,
    paddingVertical: 44,
    borderRadius: R.lg,
    backgroundColor: T.surface,
    ...SH.card,
  },

  stateIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#FFF0F4',
  },

  stateTitle: {
    marginTop: 13,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.perfilProfileCardTitulo,
    textAlign: 'center',
  },

  stateDescription: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: '#7B7F98',
    textAlign: 'center',
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.customButtonFundo,
  },

  retryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  emptyComparison: {
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderRadius: R.lg,
    backgroundColor: T.surface,
    ...SH.card,
  },

  emptyComparisonTitle: {
    marginTop: 9,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.perfilProfileCardTitulo,
  },

  emptyComparisonText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: '#7B7F98',
    textAlign: 'center',
  },

  chartCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: R.lg,
    backgroundColor: T.surface,
    ...SH.card,
  },

  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  chartTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.perfilProfileCardTitulo,
  },

  chartSubtitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '500',
    color: T.muted,
  },

  chartToggle: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.sm,
    backgroundColor: T.surfaceMuted,
  },

  evolutionChart: {
    height: 236,
    position: 'relative',
    marginHorizontal: -4,
  },

  pointTooltip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: R.sm,
    backgroundColor: T.accentSoft,
  },

  pointTooltipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: T.navy,
  },

  pointTooltipValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '800',
    color: T.ink,
  },

  evolutionTouchLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  evolutionTouchPoint: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  evolutionLabels: {
    position: 'absolute',
    bottom: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  evolutionLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: T.muted,
    textAlign: 'center',
  },

  evolutionLabelCompact: {
    fontSize: 10,
  },

  chartFootnote: {
    marginTop: 13,
    fontSize: 11,
    fontWeight: '600',
    color: T.muted,
  },

  comparisonSummary: {
    marginTop: 14,
    padding: 15,
    borderRadius: R.lg,
    backgroundColor: T.surface,
    ...SH.card,
  },

  comparisonSummaryHeader: {
    marginBottom: 14,
  },

  comparisonPeriods: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dadoDois,
  },

  comparisonMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0EDF6',
  },

  comparisonMetric: {
    flex: 1,
  },

  comparisonMetricDivider: {
    width: 1,
    height: 36,
    marginHorizontal: 14,
    backgroundColor: '#ECE8F4',
  },

  comparisonMetricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B8EA6',
  },

  comparisonMetricValue: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.perfilProfileCardTitulo,
  },

  comparisonVisualBlock: {
    marginTop: 14,
    padding: 11,
    borderRadius: R.md,
    backgroundColor: T.surfaceMuted,
  },

  comparisonVisualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  comparisonVisualHint: {
    fontSize: 11,
    fontWeight: '800',
    color: T.muted,
  },

  comparisonVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },

  comparisonVisualLabel: {
    width: 12,
    fontSize: 11,
    fontWeight: '800',
    color: T.navy,
  },

  comparisonVisualTrack: {
    flex: 1,
    height: 11,
    overflow: 'hidden',
    borderRadius: R.pill,
    backgroundColor: '#E8E4F3',
  },

  comparisonVisualFillA: {
    height: '100%',
    borderRadius: R.pill,
    backgroundColor: T.accentSecondary,
  },

  comparisonVisualFillB: {
    height: '100%',
    borderRadius: R.pill,
    backgroundColor: T.accent,
  },

  comparisonDifferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 13,
  },

  comparisonDifference: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
    color: T.accent,
  },

  comparisonDifferenceIncrease: {
    color: T.warning,
  },

  comparisonDifferenceDecrease: {
    color: '#4F8D7A',
  },

  comparisonDifferenceNeutral: {
    color: T.muted,
  },

  percentPill: {
    maxWidth: '62%',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: T.accentSoft,
  },

  percentPillIncrease: {
    backgroundColor: '#FFF0F4',
  },

  percentPillDecrease: {
    backgroundColor: '#EAF6F1',
  },

  percentPillNeutral: {
    backgroundColor: T.surfaceMuted,
  },

  percentPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.dadoUm,
    textAlign: 'center',
  },

  purchaseCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 7,
  },

  purchaseCountText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#777B96',
  },

  legendInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  legendInlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  legendInlineText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#777B96',
  },

  categoryComparisonRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2EFF7',
  },

  categoryComparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },

  categoryComparisonName: {
    flex: 1,
    paddingRight: 10,
    fontSize: 14,
    fontWeight: '800',
    color: '#3B4068',
  },

  categoryComparisonVariation: {
    maxWidth: '52%',
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#878BA3',
    textAlign: 'right',
  },

  expandButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    borderRadius: R.md,
    backgroundColor: T.surfaceMuted,
  },

  expandButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: T.navy,
  },

  categoryBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },

  categoryBarLabel: {
    width: 12,
    fontSize: 10,
    fontWeight: '800',
    color: '#8B8EA6',
  },

  categoryBarTrack: {
    flex: 1,
    height: 10,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#F0EDF7',
  },

  categoryBarFill: {
    height: '100%',
    borderRadius: 999,
  },

  categoryBarValue: {
    width: 82,
    fontSize: 11,
    fontWeight: '700',
    color: '#6C708E',
    textAlign: 'right',
  },

  modeSwitch: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#ECE9F5',
  },

  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 11,
  },

  modeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#6B6F98',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },

  modeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8589A2',
  },

  modeButtonTextActive: {
    color: COLORS.perfilProfileCardTitulo,
  },

  controlCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: R.md,
    backgroundColor: T.surface,
    ...SH.card,
  },

  controlHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },

  controlTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.perfilProfileCardTitulo,
  },

  controlSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#878BA3',
  },

  periodPickerButton: {
    maxWidth: 143,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: T.surfaceMuted,
  },

  periodPickerText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.dadoUm,
  },

  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 15,
  },

  segmentButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: T.surfaceMuted,
  },

  segmentButtonActive: {
    backgroundColor: COLORS.dadoDois,
  },

  segmentButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.dadoUm,
  },

  segmentButtonTextActive: {
    color: '#FFFFFF',
  },

  controlFootnote: {
    marginTop: 9,
    fontSize: 12,
    fontWeight: '600',
    color: '#9295AC',
  },

  comparePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },

  comparePickerButton: {
    flex: 1,
    minHeight: 65,
    justifyContent: 'center',
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: T.surfaceMuted,
  },

  comparePickerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.dadoDois,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  comparePickerValue: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.dadoUm,
  },

  validationText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.dashboardGastosGeraisAviso,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(34, 37, 64, 0.4)',
  },

  monthModal: {
    maxHeight: '92%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: T.background,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLORS.dadoDois,
    textTransform: 'uppercase',
  },

  modalTitle: {
    marginTop: 3,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.perfilProfileCardTitulo,
  },

  modalCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: T.surface,
  },

  pickerLabel: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: T.muted,
    textTransform: 'uppercase',
  },

  yearScroll: {
    gap: 8,
    paddingRight: 8,
  },

  yearChip: {
    minWidth: 64,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: R.md,
    backgroundColor: T.surface,
  },

  yearChipActive: {
    backgroundColor: T.navy,
  },

  yearChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: T.navy,
  },

  yearChipTextActive: {
    color: '#FFFFFF',
  },

  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  monthChip: {
    width: '31.5%',
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: R.sm,
    backgroundColor: T.surface,
  },

  monthChipActive: {
    backgroundColor: T.accent,
  },

  monthChipDisabled: {
    opacity: 0.42,
  },

  monthChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: T.navy,
  },

  monthChipTextActive: {
    color: '#FFFFFF',
  },

  monthChipTextDisabled: {
    color: T.muted,
  },

  monthStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },

  stepButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },

  stepButtonDisabled: {
    backgroundColor: '#F0EFF5',
  },

  selectedMonthBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  selectedMonthText: {
    marginTop: 7,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.perfilProfileCardTitulo,
    textAlign: 'center',
  },

  selectedMonthHint: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
    color: '#9295AC',
    textAlign: 'center',
  },

  modalDoneButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: COLORS.customButtonFundo,
  },

  modalDoneText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
