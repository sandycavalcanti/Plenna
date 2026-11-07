import { StyleSheet } from "react-native";
import { DASHBOARD_THEME } from "../../../constants/dashboardTheme";
export const styles = StyleSheet.create({
  container: {
    gap: 12
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#594367'
  },
  card: {
    padding: 12,
    borderRadius: DASHBOARD_THEME.radius.md,
    gap: 8,
    backgroundColor: DASHBOARD_THEME.colors.surface,
    borderWidth: 1,
    borderColor: DASHBOARD_THEME.colors.border
  },
  value: {
    fontSize: 27,
    fontWeight: '700',
    color: '#594367'
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
    fontSize: 16,
    lineHeight: 23,
    color: '#594367'
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    minHeight: 48,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8CBDD'
  },
  selected: {
    backgroundColor: '#EEE4F2',
    borderColor: '#704389'
  },
  link: {
    color: '#893467',
    fontSize: 14,
    fontWeight: '600'
  },
  action: {
    minHeight: 48,
    justifyContent: 'center'
  },
  barRow: {
    gap: 5,
    paddingVertical: 7
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFF',
    overflow: 'hidden'
  },
  bar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8660A1'
  },
  usage: {
    padding: 14,
    gap: 8,
    borderRadius: 18,
    backgroundColor: '#FFF'
  }
});
export const presentationStyles = StyleSheet.create({
  inline1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  inline2: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
