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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },

  notificationButtonPending: {
    backgroundColor: 'transparent',
    borderWidth: 0,
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

  timeCard: {
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    gap: 6,
  },

  timeCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.cadTitulo,
  },

  timeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.metaProgressFill,
    textAlign: 'center',
    paddingVertical: 8,
  },

  timeLink: {
    minHeight: 48,
    justifyContent: 'center',
  },

  timeLinkText: {
    color: COLORS.metaProgressFill,
    fontWeight: '600',
  },

  recommendationEmpty: {
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },

  inlineActionText: {
    color: COLORS.metaProgressFill,
    fontWeight: '600',
  },
});
