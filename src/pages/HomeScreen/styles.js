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

  homeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  homeSectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.buttonSecondaryBackground,
  },

  homeSectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.cadTitulo,
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

  recommendationCard: {
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    gap: 12,
  },

  recommendationStateText: {
    color: COLORS.dadoUm,
    fontSize: 13,
    lineHeight: 19,
  },

  recommendationRetry: {
    minHeight: 44,
    justifyContent: 'center',
  },

  recommendationList: {
    gap: 10,
  },

  recommendationItem: {
    padding: 14,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceMuted,
    gap: 8,
  },

  recommendationItemTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: COLORS.cadTitulo,
  },

  recommendationItemText: {
    color: COLORS.dadoUm,
    fontSize: 13,
    lineHeight: 19,
  },

  recommendationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 2,
  },

  recommendationSecondaryAction: {
    color: COLORS.dadoUm,
    fontWeight: '600',
  },

  recommendationEmptyState: {
    paddingVertical: 4,
    paddingHorizontal: 0,
  },

  inlineActionText: {
    color: COLORS.metaProgressFill,
    fontWeight: '600',
  },
});
