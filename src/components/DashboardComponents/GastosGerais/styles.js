import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export const styles = StyleSheet.create({
  section: {
    marginHorizontal: 18,
    marginVertical: 10,
    overflow: 'visible',
  },

  statsScroll: {
    flexGrow: 0,
  },

  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginLeft: 5,
    marginRight: 5,
    marginBottom: 10,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'visible',
    minWidth: 220,
  },

  statIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  statContent: {
    flex: 1,
    justifyContent: 'center',
  },

  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999999',
    marginBottom: 5,
    letterSpacing: 0.3,
  },

  statValue: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2F356B',
    marginBottom: 5,
    letterSpacing: -0.5,
  },

  statSubtitle: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
    color: '#C02C7A',
  },

  monthTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.perfilProfileCardTitulo,
    marginBottom: 8,
  },
});
