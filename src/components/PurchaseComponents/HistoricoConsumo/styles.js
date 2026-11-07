import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({
  container: {
    gap: 12
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '700',
    color: '#594367'
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
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
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  metric: {
    minWidth: 92,
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#EEE4F2'
  },
  value: {
    fontSize: 19,
    fontWeight: '700',
    color: '#594367'
  },
  empty: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#EEE4F2',
    gap: 12
  },
  action: {
    minHeight: 48,
    justifyContent: 'center'
  },
  explore: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: '#893467'
  },
  details: {
    gap: 14
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8CBDD',
    backgroundColor: '#FFF'
  },
  selected: {
    backgroundColor: '#EADCF1',
    borderColor: '#704389'
  },
  chipText: {
    fontSize: 13,
    color: '#594367'
  },
  chart: {
    gap: 2
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48
  },
  barLabel: {
    width: 105,
    fontSize: 11,
    color: '#655A70'
  },
  barTrack: {
    height: 10,
    flex: 1,
    borderRadius: 5,
    backgroundColor: '#EEE4F2',
    overflow: 'hidden'
  },
  bar: {
    height: 10,
    backgroundColor: '#8660A1',
    borderRadius: 5
  },
  reflection: {
    padding: 14,
    gap: 10,
    backgroundColor: '#EEE4F2',
    borderRadius: 18
  },
  question: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
    color: '#594367'
  }
});
