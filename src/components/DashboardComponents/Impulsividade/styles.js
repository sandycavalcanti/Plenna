import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';

const { colors: T } = DASHBOARD_THEME;

export const styles = StyleSheet.create({
  section: {
    marginHorizontal: 0,
    marginVertical: 6,
  },

  heroCard: {
    padding: 5,
  },

  distributionLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  distributionChart: {
    width: 136,
    height: 136,
    alignItems: 'center',
    justifyContent: 'center',
  },

  distributionSvg: {
    position: 'absolute',
  },

  distributionCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  distributionTotal: {
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '800',
    color: COLORS.perfilProfileCardTitulo,
  },

  distributionTotalLabel: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: T.body,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },

  distributionLegend: {
    flex: 1,
    minWidth: 0,
    gap: 12,
  },

  distributionLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  distributionLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  distributionLegendCopy: {
    flex: 1,
    minWidth: 0,
  },

  distributionLegendLabel: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: COLORS.perfilProfileCardTitulo,
  },

  distributionLegendValue: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: T.body,
  },

  ringWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  ringShell: {
    width: 172,
    height: 172,
    borderRadius: 86,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#AFA1E8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },

  ringSvg: {
    position: 'absolute',
  },

  ringCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 0,
    marginTop: 10,
  },

  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4ECFB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },

  chartPercent: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: COLORS.perfilProfileCardTitulo,
  },

  chartCenterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D74A8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.dadoDois,
    marginRight: 8,
  },

  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7B4C65',
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F356B',
  },

  infoDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#6F748D',
    fontWeight: '500',
  },

  meterTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#EFEAF8',
    marginTop: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },

  meterFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.dadoDois,
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
