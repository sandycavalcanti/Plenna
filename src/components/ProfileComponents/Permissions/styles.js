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
});
