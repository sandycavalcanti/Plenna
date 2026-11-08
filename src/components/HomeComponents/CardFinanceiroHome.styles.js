import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10
  },
  title: {
    marginBottom: 2,
    fontSize: 19,
    fontWeight: '700',
    color: '#4A4E7A',
    textAlign: 'center'
  },
  gauge: {
    width: 180,
    maxWidth: '100%',
    height: 105,
    alignSelf: 'center',
    marginTop: -2,
    marginBottom: -9
  },
  percent: {
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '800',
    textAlign: 'center'
  },
  caption: {
    fontSize: 13,
    lineHeight: 17,
    color: '#4A4E7A',
    textAlign: 'center'
  },
  state: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginVertical: 4
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 8
  },
  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#FAF7FC',
    borderRadius: 14
  },
  amount: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: '#4A4E7A',
    textAlign: 'center'
  },
  note: {
    fontSize: 11,
    lineHeight: 16,
    color: '#76658A',
    marginVertical: 2
  },
  balance: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#4A4E7A',
    textAlign: 'center',
    marginVertical: 6
  },
  touch: {
    minHeight: 48,
    marginTop: 4,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#EEE8F2',
    borderRadius: 10,
    backgroundColor: '#FAF7FC'
  },
  link: {
    color: '#76658A',
    fontSize: 13,
    fontWeight: '600'
  },
  colorList: {
    marginTop: 2
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4
  },
  colorCopy: {
    flex: 1,
    minWidth: 0
  }
});
