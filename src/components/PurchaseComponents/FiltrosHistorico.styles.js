import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#FAF7FC'
  },
  content: {
    padding: 20,
    gap: 12,
    paddingBottom: 40
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: '#594367'
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#594367'
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  option: {
    minHeight: 48,
    padding: 12,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8CBDD',
    backgroundColor: '#FFFFFF'
  },
  selected: {
    backgroundColor: '#EEE4F2',
    borderColor: '#8660A1'
  },
  input: {
    minHeight: 48,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8CBDD',
    backgroundColor: '#FFFFFF',
    fontSize: 16
  },
  apply: {
    backgroundColor: '#704389'
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    color: '#655A70'
  },
  error: {
    color: '#B32646'
  }
});
export const presentationStyles = StyleSheet.create({
  inline1: {
    color: '#FFFFFF',
    fontWeight: '700'
  }
});
