import { StyleSheet } from "react-native";
import { DASHBOARD_THEME } from "../../constants/dashboardTheme";
export const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(32,26,54,0.32)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: DASHBOARD_THEME.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingBottom: 28
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: DASHBOARD_THEME.colors.border,
    alignSelf: 'center',
    marginTop: 10
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8
  },
  sheetTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: DASHBOARD_THEME.colors.ink
  },
  close: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    marginTop: 8
  },
  button: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  label: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: '#76658A'
  },
  content: {
    paddingBottom: 8,
    gap: 8
  }
});
