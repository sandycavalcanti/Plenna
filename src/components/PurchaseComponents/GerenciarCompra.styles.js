import { StyleSheet } from "react-native";
import { DASHBOARD_THEME } from "../../constants/dashboardTheme";
export const s = StyleSheet.create({
  headerIcon: {padding: 10, borderRadius: 24, backgroundColor: DASHBOARD_THEME.colors.accentSoft},
  amount: {padding: 14, borderRadius: 16, backgroundColor: DASHBOARD_THEME.colors.accentSoft, gap: 8},
  amountValue: {fontSize: 25, fontWeight: '700', color: DASHBOARD_THEME.colors.navy},
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#0005'
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: DASHBOARD_THEME.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  title: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    color: '#21116A'
  },
  touch: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 10
  },
  option: {
    minHeight: 54,
    padding: 13,
    borderRadius: 16,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E4D8EB'
  },
  selected: {
    backgroundColor: '#EEE4F2',
    borderColor: '#8660A1'
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: DASHBOARD_THEME.colors.navy
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    color: '#655A70'
  },
  input: {
    minHeight: 50,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8CBDD',
    backgroundColor: '#FFF'
  },
  primary: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#602B83'
  },
  primaryText: {
    color: '#FFF',
    fontWeight: '600'
  },
  error: {
    color: '#B32646',
    fontSize: 14
  },
  link: {
    color: '#893467',
    fontWeight: '600'
  },
  history: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D8CBDD',
    gap: 5
  }
});
export const presentationStyles = StyleSheet.create({
  inline1: {
    padding: 20,
    gap: 12,
    paddingBottom: 40
  }
});
