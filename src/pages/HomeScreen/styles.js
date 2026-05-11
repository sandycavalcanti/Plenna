import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fundoPrincipal,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
  },

  topBarTextBlock: {
    flex: 1,
    paddingRight: 14,
  },

  greeting: {
    fontSize: 21,
    lineHeight: 24,
    fontWeight: '800',
    color: '#4A4E7A',
    letterSpacing: -0.2,
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    color: '#A0A4BC',
  },

  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },

  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C02C7A',
  },
});
