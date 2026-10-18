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
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },

  distributionChart: {
    width: 136,
    height: 136,
    alignSelf: 'center',
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
    width: '100%',
    gap: 12,
  },

  distributionLegendItem: {
    gap: 6,
  },

  distributionLegendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  distributionLegendLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: COLORS.perfilProfileCardTitulo,
  },

  distributionLegendTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: T.track,
  },

  distributionLegendFill: {
    height: '100%',
    borderRadius: 999,
  },

  distributionLegendValue: {
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

  limitContext: {
    width: '100%',
    marginTop: 2,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
    gap: 7,
  },

  limitContextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  limitContextTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: T.ink,
  },

  limitContextTotal: {
    fontSize: 12,
    fontWeight: '600',
    color: T.body,
  },

  limitContextTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: T.track,
  },

  limitContextFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.dadoDois,
  },

  limitContextLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },

  limitContextLabel: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: T.body,
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

  chartPercent: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: COLORS.perfilProfileCardTitulo,
  },

  chartCenterLabel: {
    maxWidth: 112,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: '#6D74A8',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  emptyMessage: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 16,
    fontWeight: '500',
  },
});
