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

  // Container do item de meta (alinhamento horizontal)
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  // Indicador visual de seleção (checkbox não interativo)
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    marginRight: 10,
  },

  // Texto do valor da meta (destaque)
  value: {
    fontWeight: 'bold',
  },

});
