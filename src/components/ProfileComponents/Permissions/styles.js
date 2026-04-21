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
    paddingVertical: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(131, 111, 226, 0.18)',
  },

  // Remove divisor da última linha
  lastRow: {
    borderBottomWidth: 0,
    marginBottom: 2,
  },

  // Container de textos para evitar sobreposição com o switch
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },

  // Texto principal da permissão
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F356B',
  },

  // Texto secundário explicativo
  sub: {
    fontSize: 12,
    marginTop: 3,
    color: '#6D74A8',
    lineHeight: 16,
  },

  // Mensagem de aviso sobre impacto das permissões
  warning: {
    fontSize: 12,
    color: '#6D74A8',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(131, 111, 226, 0.35)',
    backgroundColor: '#EEF1FF',
    lineHeight: 16,
  },
});
