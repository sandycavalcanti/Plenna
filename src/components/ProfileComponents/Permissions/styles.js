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
    borderBottomColor: COLORS.border,
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
    color: COLORS.cadTitulo,
  },

  sub: {
    fontSize: 12,
    marginTop: 3,
    color: COLORS.dadoUm,
    lineHeight: 16,
  },

  status: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
    color: COLORS.dadoUm,
  },

  warning: {
    marginTop: 14,
    fontSize: 12,
    color: COLORS.dadoUm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.buttonSecondaryBackground,
    lineHeight: 16,
  },

  memorySection: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
  },

  memoryComposer: {
    marginTop: 6,
  },

  memoryInput: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.cadTitulo,
    backgroundColor: COLORS.surface,
  },

  memoryButton: {
    alignSelf: 'stretch',
    marginTop: 8,
    width: '100%',
    minHeight: 42,
  },

  memoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  memoryContent: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.cadTitulo,
  },

  memoryDelete: {
    color: COLORS.buttonDangerText,
    fontSize: 12,
    fontWeight: '700',
  },

  memoryError: {
    marginTop: 8,
    color: COLORS.buttonDangerText,
    fontSize: 12,
  },

  memorySuccess: {
    marginTop: 8,
    color: COLORS.buttonPositiveText,
    fontSize: 12,
  },
});
