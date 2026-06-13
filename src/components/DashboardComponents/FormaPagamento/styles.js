import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginVertical: 10,
  },

  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginVertical: -10,
  },

  donutSvg: {
    alignSelf: 'center',
  },

  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 6,
  },

  expandButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dadoDois,
  },

  detailsSection: {
    marginTop: 10,
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


  summaryBadgeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2F356B',
  },

  summaryBadgeText: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: '#7A7A7A',
    textAlign: 'center',
  },

  legendList: {
    marginTop: 6,
    gap: 10,
  },

  legendItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#F0E6F4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  legendTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  legendLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  legendLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#2F356B',
  },

  legendValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4A4E7A',
  },

  legendTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: '#F1E9EE',
    overflow: 'hidden',
    marginTop: 8,
  },

  legendFill: {
    height: '100%',
    borderRadius: 999,
  },

  legendPercent: {
    marginTop: 6,
    fontSize: 12,
    color: '#8B8B8B',
    fontWeight: '500',
  },

  emptyMessage: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 16,
    fontWeight: '500',
  },
});
