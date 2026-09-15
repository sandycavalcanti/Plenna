import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

// Estilos agrupados por responsabilidade para manter a tela consistente com
// o fundo, os títulos e os botões já utilizados no aplicativo.
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    // O lilás muito suave cria contraste com os cards brancos sem introduzir
    // uma cor nova fora da paleta já existente do Plenna.
    backgroundColor: COLORS.cadCaixaPreferenciasFundo,
  },
  header: {
    // O header permanece sobre o fundo geral; o respiro substitui uma faixa
    // chapada e deixa a lista começar com mais elegância.
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    // Pequeno ponto de identidade visual, sem ser um badge ou uma decoração
    // vazia: o ícone comunica imediatamente o assunto da tela.
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cadCaixaPreferenciasValorFundo,
  },
  headerTextGroup: {
    flex: 1,
    gap: 2,
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
