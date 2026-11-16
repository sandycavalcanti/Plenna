import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';
const {
  colors,
  spacing,
  radius,
  shadows
} = DASHBOARD_THEME;
export default StyleSheet.create({
monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md
  },
modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(34, 33, 58, 0.34)',
    justifyContent: 'center',
    padding: spacing.lg
  },
modalSafeArea: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent'
  },
modalSheet: {
    width: '100%',
    maxWidth: 380,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card
  },
modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
modalTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21
  },
modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 0,
    paddingVertical: 0
  },
modalMonthNavigation: {
    marginTop: spacing.lg,
    marginBottom: spacing.md
  },
modalMonthNavigationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted
  },
modalMonthTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800'
  },
modalCalendarDayCell: {
    height: 40
  },
modalCalendarDayButton: {
    height: 40,
    minHeight: 40
  },
modalCalendarDayButtonSelected: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.hero
  },
monthNavigationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center'
  },
monthTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800'
  },
weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm
  },
weekdayText: {
    width: '14.28%',
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center'
  },
calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
calendarDayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
calendarDayButton: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
calendarDayButtonDisabled: {
    opacity: 0.35
  },
calendarDayButtonSelected: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.hero
  },
calendarDayText: {
    color: colors.ink,
    fontSize: 13
  },
calendarDayTextDisabled: {
    color: colors.muted
  },
calendarDayTextSelected: {
    color: COLORS.buttonPrimaryText,
    fontWeight: '800'
  }
});
