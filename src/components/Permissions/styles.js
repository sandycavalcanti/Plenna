/**
 * Arquivo: Permissions/styles.js
 * Descrição: Estilos do componente Permissions, responsáveis pela
 * organização visual das permissões, incluindo layout das linhas,
 * tipografia e destaque de mensagens informativas.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importação do módulo de estilos do React Native
import { StyleSheet } from 'react-native';

/**
 * Objeto de estilos do componente
 * Define layout, alinhamento e estilos de texto das permissões
 */
export default StyleSheet.create({

  // Container de cada linha de permissão (texto + switch)
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  // Texto principal da permissão
  text: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Texto secundário explicativo
  sub: {
    fontSize: 12,
    color: 'gray',
  },

  // Mensagem de aviso sobre impacto das permissões
  warning: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },

});