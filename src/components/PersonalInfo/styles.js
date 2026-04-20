/**
 * Arquivo: PersonalInfo/styles.js
 * Descrição: Estilos do componente PersonalInfo, responsáveis pela
 * organização visual das informações pessoais, incluindo campos de texto
 * e elementos com aparência desabilitada.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

import { StyleSheet } from 'react-native';

/**
 * Objeto de estilos do componente
 * Define tipografia, espaçamento e diferenciação visual de campos
 */
export default StyleSheet.create({

  // Texto padrão das informações
  text: {
    fontSize: 14,
  },

  // Container de campo desabilitado (visual diferenciado)
  disabledField: {
    marginTop: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F2',
  },

  // Rótulo do campo desabilitado
  label: {
    fontSize: 12,
    color: 'gray',
  },

  // Texto do valor em estado desabilitado
  disabledText: {
    fontSize: 14,
    color: '#999',
  },

});