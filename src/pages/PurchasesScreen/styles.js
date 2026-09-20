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
  tabsScroll: {
    flexGrow: 0,
  },
  tabsContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    minHeight: 38,
    minWidth: 0,
    flex: 1,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#EEEAF8',
    // borderBottomWidth: 1,
    // borderBottomColor: 'rgba(130, 111, 226, 0.79)',
  },
  activeTab: {
    Color: COLORS.cadTitulo,
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    maxWidth: '100%',
  },
  tabText: {
    color: COLORS.dadoUm,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  tabCount: {
    color: COLORS.dadoUm,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 0,
  },
  activeTabText: {
    color: COLORS.cadTitulo,
  },
  tabIndicator: {
    // O indicador acompanha o progresso horizontal do pager por opacidade,
    // suavizando a troca visual sem adicionar uma biblioteca de tabs.
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    height: 2,
    borderRadius: 2,
    backgroundColor: COLORS.cadTitulo,
  },
  pagerPage: {
    flex: 1,
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
