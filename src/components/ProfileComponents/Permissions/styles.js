/**
 * Arquivo: Permissions/styles.js
 * Descrição: Estilos do componente Permissions, responsáveis pela
 * organização visual das permissões, incluindo layout das linhas,
 * tipografia e destaque de mensagens informativas.
 * Autor: Marina Souza
 * Última atualização: 13/09/2026
 */

import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export default StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(131, 111, 226, 0.18)',
  },

  lastRow: {
    borderBottomWidth: 0,
    marginBottom: 2,
  },

  textContainer: {
    flex: 1,
    paddingRight: 12,
  },

  text: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.perfilInfoLabel,
  },

  sub: {
    fontSize: 12,
    marginTop: 3,
    color: COLORS.perfilInfoValor,
    lineHeight: 16,
  },

  status: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
    color: COLORS.perfilInfoValor,
  },

  warning: {
    marginTop: 14,
    fontSize: 12,
    color: COLORS.perfilPermissaoAvisoTexto,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.perfilPermissaoAvisoBorda,
    backgroundColor: COLORS.perfilPermissaoAvisoFundo,
    lineHeight: 16,
  },

  memorySection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(131, 111, 226, 0.18)',
  },

  memoryComposer: {
    marginTop: 6,
  },

  memoryInput: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: 'rgba(131, 111, 226, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.perfilInfoLabel,
    backgroundColor: '#FFFFFF',
  },

  memoryButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: '#8660A1',
  },

  memoryButtonDisabled: {
    opacity: 0.45,
  },

  memoryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  memoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(131, 111, 226, 0.12)',
  },

  memoryContent: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.perfilInfoLabel,
  },

  memoryDelete: {
    color: '#A31414',
    fontSize: 12,
    fontWeight: '700',
  },

  memoryError: {
    marginTop: 8,
    color: '#A31414',
    fontSize: 12,
  },

  memorySuccess: {
    marginTop: 8,
    color: '#34704C',
    fontSize: 12,
  },
});
