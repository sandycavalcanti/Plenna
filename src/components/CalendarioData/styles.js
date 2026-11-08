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
    color: '#FFFFFF',
    fontWeight: '800'
  }
});
