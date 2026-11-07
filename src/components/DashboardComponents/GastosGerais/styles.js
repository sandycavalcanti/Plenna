import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';

const { colors: DASHBOARD_COLORS, borders: DASHBOARD_BORDERS } = DASHBOARD_THEME;

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
    backgroundColor: DASHBOARD_COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginLeft: 5,
    marginRight: 5,
    marginBottom: 10,
    borderTopWidth: 4,
    ...DASHBOARD_BORDERS.card,
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
