import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginVertical: 10,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.dashboardBoxMaiorTempo,
    borderWidth: 1,
    borderColor: COLORS.dashboardBoxMaiorTempoBorda,
    marginBottom: 8,
  },

  summaryCopy: {
    flex: 1,
    paddingRight: 12,
  },

  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.dashboardAlertaCardRecomendacao,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  summaryValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: '#2F356B',
  },

  summaryCaption: {
    fontSize: 13,
    color: '#7A7A7A',
    marginTop: 4,
    fontWeight: '500',
  },

  summaryBadge: {
    minWidth: 86,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.dashboardBoxMaiorTempoBorda,
  },

  summaryBadgeText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#2F356B',
  },

  rankList: {
    marginTop: 2,
  },

  rankItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 5,
  },

  rankPosition: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },

  rankPositionText: {
    fontSize: 13,
    fontWeight: '800',
  },

  rankContent: {
    flex: 1,
    minWidth: 0,
  },

  rankTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  rankLabel: {
    flex: 1,
    paddingRight: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#2F356B',
  },

  rankValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555A8C',
  },

  rankTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#F1E9EE',
    overflow: 'hidden',
  },

  rankFill: {
    height: '100%',
    borderRadius: 999,
    transformOrigin: 'left',
  },

  rankShare: {
    marginTop: 6,
    fontSize: 12,
    color: '#8B8B8B',
    fontWeight: '500',
  },

  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    gap: 6,
  },

  expandButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dadoDois,
  },

  emptyMessage: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 16,
    fontWeight: '500',
  },
});
