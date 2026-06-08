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
  chartCard: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },

  barChartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },

  barItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },

  barValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A4E7A',
    marginBottom: 5,
  },

  barTrack: {
    width: '80%',
    height: 120,
    backgroundColor: '#F2ECF6',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },

  barFill: {
    width: '100%',
    borderRadius: 10,
  },

  displayedCategories: {
    gap: 10,
  },

  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  cardContent: {
    flex: 1,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2F356B',
  },

  categoryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F356B',
    marginBottom: 6,
  },

  categoryPercent: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
  },

  progressBarContainer: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    borderRadius: 3,
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
