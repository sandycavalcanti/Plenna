import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fundoPrincipal,
  },

  topBar: {
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.dashboardHeaderFundo,
    borderBottomColor: COLORS.dashboardHeaderBorda,
    borderBottomWidth: 1,
  },

  monthChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.dashboardChipMesFundo,
  },

  monthChipText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dashboardChipMesTexto,
  },

  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.fundoPrincipal,
  },

  scroll: {
    flex: 1,
    backgroundColor: COLORS.fundoPrincipal,
  },

  scrollContent: {
    paddingTop: 4,
  },
});
