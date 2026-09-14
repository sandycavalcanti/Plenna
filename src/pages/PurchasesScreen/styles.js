import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

// Estilos agrupados por responsabilidade para manter a tela consistente com
// o fundo, os títulos e os botões já utilizados no aplicativo.
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fundoPrincipal,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dashboardHeaderBorda,
  },
  title: {
    fontFamily: 'SugoDisplay',
    fontSize: 32,
    color: COLORS.cadTitulo,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
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
