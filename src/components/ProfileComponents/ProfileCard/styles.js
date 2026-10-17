/**
 * Arquivo: ProfileCard/styles.js
 * Descrição: Estilos do componente ProfileCard, responsáveis pela
 * estrutura visual do card, incluindo bordas, cabeçalho e organização do conteúdo interno.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importação do módulo de estilos do React Native
import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';

const { colors: DASHBOARD_COLORS, radius: DASHBOARD_RADIUS, shadows: DASHBOARD_SHADOWS } = DASHBOARD_THEME;

/**
 * Objeto de estilos do componente
 * Define layout, espaçamento, tipografia e aparência geral do card
 */
export default StyleSheet.create({
  // Container principal do card
  container: {
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.perfilProfileCardBorda,
    borderRadius: 12,
    padding: 12,
    paddingTop: 24,
    marginTop: 6,
    marginBottom: 12,
  },

  // Cabeçalho com título e botão de ação
  header: {
    position: 'absolute',
    top: -13,
    left: 12,
    right: 12,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  actionsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Fundo para recortar visualmente a borda atrás do título
  titleWrapper: {
    paddingHorizontal: 8,
    backgroundColor: COLORS.fundoPrincipal,
  },

  // Fundo para recortar visualmente a borda atrás do ícone de edição
  editButton: {
    paddingHorizontal: 6,
    backgroundColor: COLORS.fundoPrincipal,
  },

  // Estilo do título do card
  title: {
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.perfilProfileCardTitulo,
  },

  // Container do conteúdo interno
  content: {
    gap: 10,
  },

  dashboardContainer: {
    position: 'relative',
    borderWidth: 0,
    borderRadius: DASHBOARD_RADIUS.lg,
    padding: 16,
    paddingTop: 16,
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: DASHBOARD_COLORS.surface,
    ...DASHBOARD_SHADOWS.card,
  },

  dashboardHeader: {
    position: 'relative',
    top: 0,
    left: 0,
    right: 0,
    marginBottom: 12,
  },

  dashboardTitleWrapper: {
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },

  dashboardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: DASHBOARD_COLORS.ink,
  },

  dashboardContent: {
    gap: 12,
  },
});
