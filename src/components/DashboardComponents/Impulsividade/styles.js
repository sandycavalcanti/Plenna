import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export const styles = StyleSheet.create({
  section: {
    marginHorizontal: 18,
    marginVertical: 10,
  },

  heroCard: {
    padding: 5,
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
    borderWidth: 1,
    borderColor: '#EEE6FA',
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
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.dadoDois,
    backgroundColor: '#FFFFFF',
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
