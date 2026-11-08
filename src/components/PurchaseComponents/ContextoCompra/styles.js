import { StyleSheet } from "react-native";
import { DASHBOARD_THEME } from "../../../constants/dashboardTheme";
export const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 12,
    gap: 3,
    padding: 4,
    backgroundColor: DASHBOARD_THEME.colors.accentSoft,
    borderRadius: 16
  },
  tab: {
    flex: 1,
    minWidth: 65,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderRadius: 12
  },
  tabSelected: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#893467'
  },
  tabText: {
    color: '#655A70',
    fontSize: 12,
    textAlign: 'center',
    flexShrink: 1
  },
  tabTextSelected: {
    color: DASHBOARD_THEME.colors.ink,
    fontWeight: '700'
  },
  container: {
    flex: 1,
    backgroundColor: DASHBOARD_THEME.colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 56,
    flexWrap: 'wrap',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: DASHBOARD_THEME.colors.border
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: DASHBOARD_THEME.colors.ink
  },
  iconButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    padding: 16,
    paddingBottom: 32
  },
  panel: {
    gap: 12
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#704389'
  },
  formTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    color: DASHBOARD_THEME.colors.ink
  },
  note: {
    fontSize: 14,
    lineHeight: 21,
    color: '#655A70'
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    color: '#655A70'
  },
  question: {
    fontSize: 21,
    lineHeight: 29,
    fontWeight: '600',
    color: DASHBOARD_THEME.colors.ink,
    marginVertical: 6
  },
  primary: {
    minHeight: 52,
    padding: 14,
    borderRadius: 18,
    backgroundColor: DASHBOARD_THEME.colors.navy,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF'
  },
  action: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: '#893467'
  },
  regretSection: {
    borderTopWidth: 1,
    borderTopColor: DASHBOARD_THEME.colors.border,
    marginTop: 8,
    paddingTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  summary: {
    borderRadius: 20,
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EEE4F2'
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 9
  },
  summaryLabel: {
    flex: 1,
    gap: 2
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: DASHBOARD_THEME.colors.ink
  },
  notice: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFF',
    marginBottom: 16,
    gap: 8
  }
});
