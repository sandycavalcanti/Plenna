/**
 * Arquivo: Goals/styles.js
 * Descrição: Estilos do componente Goals, responsáveis pela organização
 * visual dos itens de meta, incluindo layout, alinhamento e destaque de valores.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

/**
 * Objeto de estilos do componente
 * Define estrutura visual e tipografia dos elementos de metas
 */
export default StyleSheet.create({
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 6,
  },

  emptyStateTitle: {
    fontSize: 16,
    color: COLORS.perfilMetaTitulo,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptyStateSubtitle: {
    fontSize: 13,
    color: COLORS.perfilInfoValor,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 6,
  },

  emptyStateAction: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.cadTextoAdicionarLimites,
    fontWeight: '700',
  },

  // Container do item de meta (clicável)
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.perfilMetaBorda,
    borderRadius: 22,
    backgroundColor: COLORS.perfilMetaFundo,
  },

  // Indicador visual de seleção
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: COLORS.perfilCheckboxBorda,
    backgroundColor: COLORS.perfilCheckboxFundo,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  // Estado marcado do indicador
  checkboxChecked: {
    backgroundColor: COLORS.perfilCheckboxFundo,
  },

  // Conteúdo textual da meta
  goalContent: {
    flex: 1,
  },

  // Nome da meta
  goalName: {
    fontSize: 15,
    color: COLORS.perfilMetaTitulo,
    fontWeight: '500',
    lineHeight: 22,
  },

  // Texto do valor da meta (destaque)
  value: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.perfilMetaValor,
    fontWeight: '600',
  },
});
