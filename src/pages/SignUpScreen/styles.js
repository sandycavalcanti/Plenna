import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFEFF5',
    paddingTop: -42,
  },
  overlay: {
    width: '85%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingTop: 30,
  },
  borderOverlay: {
    borderWidth: 2,
    borderRadius: 18,
    borderColor: '#B6ACEA',
    width: '95%',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F2F1F8',
    shadowColor: '#8B86B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 6,
    elevation: 4,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 10,
  },
  stepTwoContainer: {
    width: '95%',
    alignItems: 'center',
  },
  titulo: {
    fontFamily: 'SugoDisplay',
    fontSize: 52,
    color: '#595D7C',
    marginBottom: 10,
  },
  segmentAction: {
    marginTop: 10,
    marginBottom: 20,
  },
  segmentActionText: {
    color: '#EF596D',
    fontSize: 18,
    textAlign: 'center',
  },
  segmentPlus: {
    fontFamily: 'SugoDisplay',
  },
  checkboxRow: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 1,
    backgroundColor: '#AFA1E8',
    marginRight: 10,
  },
  checkboxText: {
    color: '#111111',
  },
  checkboxLink: {
    color: '#F07D86',
  },
  finishButton: {
    marginTop: 10,
    minWidth: 155,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#DDB4CE',
    shadowColor: '#555555',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  finishButtonText: {
    color: '#F5EAF2',
    textAlign: 'center',
  },
  button: {
    marginTop: 15,
  },
});
