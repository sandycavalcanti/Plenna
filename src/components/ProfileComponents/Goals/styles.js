/**
 * Arquivo: Goals/styles.js
 * Descrição: Estilos do componente Goals, responsáveis pela organização
 * visual dos itens de meta, incluindo layout, alinhamento e destaque de valores.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

import { StyleSheet } from 'react-native';

/**
 * Objeto de estilos do componente
 * Define estrutura visual e tipografia dos elementos de metas
 */
export default StyleSheet.create({
  // Container do item de meta (clicável)
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(137, 196, 209, 0.9)',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },

  // Indicador visual de seleção
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#AFA6E6',
    backgroundColor: '#AFA6E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  // Estado marcado do indicador
  checkboxChecked: {
    backgroundColor: '#AFA6E6',
  },

  // Conteúdo textual da meta
  goalContent: {
    flex: 1,
  },

  // Nome da meta
  goalName: {
    fontSize: 15,
    color: '#111111',
    fontWeight: '500',
    lineHeight: 22,
  },

  // Texto do valor da meta (destaque)
  value: {
    marginTop: 2,
    fontSize: 12,
    color: '#5A6293',
    fontWeight: '600',
  },
});
