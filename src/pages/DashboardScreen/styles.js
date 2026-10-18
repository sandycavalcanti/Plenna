import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';

const { colors: T, spacing: S, radius: R, shadows: SH } = DASHBOARD_THEME;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.background,
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
    paddingTop: 13,
    paddingHorizontal: S.lg,
  },

  pageIntro: {
    marginBottom: 7,
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
    fontSize: 27,
    lineHeight: 31,
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
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: R.md,
    backgroundColor: T.surface,
    ...SH.card,
  },

  periodSelectorIcon: {
    width: 34,
    height: 34,
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
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: T.muted,
    textTransform: 'uppercase',
  },

  periodSelectorValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '800',
    color: T.ink,
  },

  financialSummaryCard: {
    marginBottom: 12,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 13,
    borderRadius: R.md,
    backgroundColor: T.surface,
    ...SH.card,
  },

  financialSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  financialSummaryEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: T.muted,
    textTransform: 'uppercase',
  },

  financialSummaryLabel: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '800',
    color: T.ink,
  },

  financialSummaryContext: {
    maxWidth: '42%',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: T.muted,
    textAlign: 'right',
  },

  financialSummaryValue: {
    marginTop: 9,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '800',
    letterSpacing: -0.7,
    color: T.ink,
  },

  financialSummaryValueSuffix: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0,
    color: T.body,
  },

  financialBars: {
    marginTop: 15,
  },

  financialBarRow: {
    marginTop: 9,
  },

  financialComparisonRows: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },

  financialBarHeader: {
    flex: 1,
    gap: 3,
  },

  financialBarHeaderEnd: {
    alignItems: 'flex-end',
  },

  financialBarLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: T.body,
  },

  financialBarValue: {
    fontSize: 13,
    fontWeight: '800',
    color: T.ink,
  },

  financialBarTrack: {
    height: 11,
    marginTop: 8,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: R.pill,
    backgroundColor: T.track,
  },

  financialBarFill: {
    height: '100%',
    borderRadius: R.pill,
    backgroundColor: T.accent,
  },

  financialBarFillExcess: {
    height: '100%',
    position: 'absolute',
    borderRadius: R.pill,
    backgroundColor: T.warning,
  },

  financialBarLimitMarker: {
    position: 'absolute',
    top: -3,
    width: 2,
    height: 17,
    borderRadius: R.pill,
    backgroundColor: T.navy,
  },

  financialSummaryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 14,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },

  financialSummaryStatusCopy: {
    flex: 1,
  },

  financialSummaryStatusTitle: {
    fontSize: 13,
    fontWeight: '800',
  },

  financialSummaryStatusText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: T.body,
  },

  financialSummaryStatusExceeded: {
    color: T.warning,
    fontWeight: '800',
  },

  financialSummaryPercentBlock: {
    maxWidth: '40%',
    alignItems: 'flex-end',
  },

  financialSummaryPercentValue: {
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '800',
  },

  financialSummaryPercentLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: T.muted,
    textAlign: 'right',
  },

  noLimitState: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 11,
    borderRadius: R.sm,
    backgroundColor: T.surfaceMuted,
  },

  noLimitTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: T.body,
  },

  noLimitText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
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

  periodIndicatorsSection: {
    marginTop: 6,
    marginBottom: 0,
    marginHorizontal: 0,
  },

  periodIndicatorsCard: {
    marginLeft: 0,
    marginBottom: 0,
    marginRight: 0,
    ...SH.card,
  },

  periodIndicatorsContent: {
    gap: 10,
    paddingHorizontal: 5,
    paddingVertical: 6,
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

  evolutionChartCompact: {
    height: 214,
  },

  singlePeriodSummary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: R.sm,
    backgroundColor: T.surfaceMuted,
  },

  singlePeriodLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: T.body,
  },

  singlePeriodValue: {
    fontSize: 17,
    fontWeight: '800',
    color: T.ink,
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

  comparisonSummaryPeriods: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: T.muted,
  },

  comparisonPeriodTag: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 5,
  },

  comparisonPeriodDot: {
    width: 8,
    height: 8,
    flexShrink: 0,
    borderRadius: 4,
  },

  comparisonPeriodTagText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    color: T.navy,
  },

  comparisonPeriodTagTextCompact: {
    fontSize: 11,
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

  comparisonVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 19,
    marginTop: 6,
    gap: 8,
  },

  comparisonVisualPeriodLabel: {
    width: 48,
    fontSize: 11,
    fontWeight: '700',
    color: T.body,
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

  periodEndRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },

  periodEndCopy: {
    flex: 1,
  },

  periodEndLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: T.body,
  },

  periodEndHint: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: T.muted,
  },

  periodEndButton: {
    maxWidth: '58%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: R.sm,
    backgroundColor: T.surfaceMuted,
  },

  periodEndButtonPrefix: {
    fontSize: 11,
    fontWeight: '700',
    color: T.muted,
  },

  periodEndButtonValue: {
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
    borderWidth: 1,
    borderColor: T.border,
    borderTopWidth: 4,
    borderRadius: 12,
    backgroundColor: T.surfaceMuted,
  },

  comparePickerValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  comparePickerValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: T.navy,
  },

  categoryBarMarker: {
    width: 7,
    height: 7,
    flexShrink: 0,
    borderRadius: 4,
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: T.surface,
    ...SH.card,
  },

  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    marginBottom: 13,
    borderRadius: R.pill,
    backgroundColor: '#D8D5E3',
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
    backgroundColor: T.surfaceMuted,
  },

  pickerLabel: {
    marginTop: 15,
    marginBottom: 7,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: T.muted,
    textTransform: 'uppercase',
  },

  yearControl: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    borderRadius: R.sm,
    backgroundColor: T.surfaceMuted,
  },

  yearControlButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.sm,
    backgroundColor: T.surface,
  },

  yearControlButtonDisabled: {
    opacity: 0.3,
  },

  yearControlValue: {
    fontSize: 17,
    fontWeight: '800',
    color: T.ink,
  },

  singleYearRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },

  singleYearValue: {
    fontSize: 17,
    fontWeight: '800',
    color: T.ink,
  },

  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  monthChip: {
    width: '31.8%',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: R.sm,
    backgroundColor: T.surfaceMuted,
  },

  monthChipActive: {
    backgroundColor: T.accent,
  },

  monthChipDisabled: {
    opacity: 0.35,
  },

  monthChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: T.navy,
  },

  monthChipTextActive: {
    color: '#FFFFFF',
  },

  monthChipTextDisabled: {
    color: T.muted,
  },

  selectedMonthBlock: {
    marginTop: 13,
    paddingHorizontal: 2,
  },

  selectedMonthText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.perfilProfileCardTitulo,
    textAlign: 'left',
  },

  selectedMonthHint: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '600',
    color: T.muted,
    textAlign: 'left',
  },

  modalDoneButton: {
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: R.sm,
    backgroundColor: COLORS.customButtonFundo,
  },

  modalDoneText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
