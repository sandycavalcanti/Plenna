import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fundoPrincipal,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 32,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cadCaixaPreferenciasValorFundo,
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontFamily: 'SugoDisplay',
    fontSize: 29,
    color: COLORS.cadTitulo,
    fontWeight: '500',
  },
  subtitle: {
    color: COLORS.dadoUm,
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 28,
  },
  emptyContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 15,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(131, 111, 226, 0.12)',
  },
  unreadCard: {
    backgroundColor: '#F2F1F8',
    borderColor: 'rgba(131, 111, 226, 0.28)',
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cadCaixaPreferenciasValorFundo,
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeLabel: {
    flex: 1,
    color: COLORS.dadoUm,
    fontSize: 12,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C02C7A',
  },
  cardTitle: {
    marginTop: 5,
    color: COLORS.cadTitulo,
    fontSize: 16,
    fontWeight: '700',
  },
  unreadTitle: {
    fontWeight: '800',
  },
  cardMessage: {
    marginTop: 5,
    color: COLORS.dadoUm,
    fontSize: 14,
    lineHeight: 20,
  },
  cardDate: {
    marginTop: 9,
    color: '#9296AD',
    fontSize: 12,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 16,
  },
  stateText: {
    color: COLORS.dadoUm,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.customButtonFundo,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: COLORS.customButtonTexto,
    fontSize: 15,
    fontWeight: '600',
  },
});
