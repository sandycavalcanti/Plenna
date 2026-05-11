import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
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
    marginRight: 12,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
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
    fontWeight: '600',
    color: '#C02C7A',
  },
});
