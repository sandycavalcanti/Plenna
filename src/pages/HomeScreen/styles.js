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

  notificationButtonPending: {
    backgroundColor: '#FFF2F7',
    borderWidth: 1,
    borderColor: 'rgba(192, 44, 122, 0.2)',
  },

  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 3,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C02C7A',
  },

  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
});
