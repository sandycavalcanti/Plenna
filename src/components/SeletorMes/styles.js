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
  sheet: {
    maxHeight: '90%',
  },
  monthModal: {
    flexShrink: 1,
    paddingHorizontal: S.lg,
    paddingTop: S.sm,
    paddingBottom: S.sm,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: T.surface,
    ...SH.card
  },
  inline: {
    padding: S.md,
    borderRadius: R.lg,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    marginBottom: S.sm,
    borderRadius: R.pill,
    backgroundColor: COLORS.borderSoft
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: S.sm
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.pill,
    backgroundColor: T.surfaceAccent,
    borderWidth: 1,
    borderColor: COLORS.borderSoft
  },
  yearSection: {
    marginBottom: S.md
  },
  sectionLabel: {
    marginBottom: S.xs,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: T.muted,
    textTransform: 'uppercase'
  },
  yearControl: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
    borderRadius: R.md,
    backgroundColor: T.surfaceAccent,
    borderWidth: 1,
    borderColor: COLORS.borderSoft
  },
  yearControlButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.pill,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border
  },
  yearControlButtonDisabled: {
    opacity: 0.35
  },
  yearControlValue: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '800',
    color: T.navy,
    includeFontPadding: false
  },
  monthSectionHeader: {
    marginBottom: S.xs
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: T.navy
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6
  },
  monthChip: {
    width: '31.2%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S.xs,
    borderRadius: 12,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSoft
  },
  monthChipActive: {
    backgroundColor: T.accent,
    borderColor: T.accent
  },
  monthChipDisabled: {
    backgroundColor: T.surfaceMuted,
    borderColor: T.border,
    opacity: 0.75
  },
  monthChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: T.navy,
    textAlign: 'center',
    includeFontPadding: false
  },
  monthChipTextActive: {
    color: COLORS.buttonPrimaryText
  },
  monthChipTextDisabled: {
    color: T.muted
  }
});
