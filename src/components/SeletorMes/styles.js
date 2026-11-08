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
modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(34, 37, 64, 0.4)'
  },
monthModal: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: T.surface,
    ...SH.card
  },
sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    marginBottom: 13,
    borderRadius: R.pill,
    backgroundColor: '#D8D5E3'
  },
modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
modalEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLORS.dadoDois,
    textTransform: 'uppercase'
  },
modalTitle: {
    marginTop: 3,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.perfilProfileCardTitulo
  },
modalCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: T.surfaceMuted
  },
pickerLabel: {
    marginTop: 15,
    marginBottom: 7,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: T.muted,
    textTransform: 'uppercase'
  },
yearControl: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    borderRadius: R.sm,
    backgroundColor: T.surfaceMuted
  },
yearControlButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.sm,
    backgroundColor: T.surface
  },
yearControlButtonDisabled: {
    opacity: 0.3
  },
yearControlValue: {
    fontSize: 17,
    fontWeight: '800',
    color: T.ink
  },
singleYearRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between'
  },
singleYearValue: {
    fontSize: 17,
    fontWeight: '800',
    color: T.ink
  },
monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7
  },
monthChip: {
    width: '31.8%',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: R.sm,
    backgroundColor: T.surfaceMuted
  },
monthChipActive: {
    backgroundColor: T.accent
  },
monthChipDisabled: {
    opacity: 0.35
  },
monthChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: T.navy
  },
monthChipTextActive: {
    color: '#FFFFFF'
  },
monthChipTextDisabled: {
    color: T.muted
  },
selectedMonthBlock: {
    marginTop: 13,
    paddingHorizontal: 2
  },
selectedMonthText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.perfilProfileCardTitulo,
    textAlign: 'left'
  },
selectedMonthHint: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '600',
    color: T.muted,
    textAlign: 'left'
  },
modalDoneButton: {
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: R.sm,
    backgroundColor: COLORS.customButtonFundo
  },
modalDoneText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF'
  }
});
