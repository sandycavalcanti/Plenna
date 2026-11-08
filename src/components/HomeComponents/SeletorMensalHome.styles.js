import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center'
  },
  button: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabled: {
    opacity: 0.35
  },
  label: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4
  },
  month: {
    color: '#4A4E7A',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center'
  },
  note: {
    color: '#76658A',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 3
  }
});
