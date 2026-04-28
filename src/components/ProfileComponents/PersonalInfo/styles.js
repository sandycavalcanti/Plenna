/**
 * Arquivo: PersonalInfo/styles.js
 * Descrição: Estilos do componente PersonalInfo, responsáveis pela
 * organização visual das informações pessoais, incluindo campos de texto
 * e elementos com aparência desabilitada.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

/**
 * Objeto de estilos do componente
 * Define tipografia, espaçamento e diferenciação visual de campos
 */
export default StyleSheet.create({
  // Texto padrão das informações
  text: {
    fontSize: 14,
  },

  // Rótulo principal da informação (ex.: Telefone)
  fieldLabel: {
    fontWeight: '700',
    color: COLORS.perfilInfoLabel,
  },

  // Valor da informação em estilo mais neutro
  fieldValue: {
    fontWeight: '400',
    color: COLORS.perfilInfoValor,
  },

  // Container de campo desabilitado (visual diferenciado)
  disabledField: {
    marginTop: 2,
    marginBottom: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.perfilPermissaoAvisoBorda,
    backgroundColor: COLORS.perfilPermissaoAvisoFundo,
  },

  // Rótulo do campo desabilitado
  label: {
    fontSize: 12,
    color: COLORS.perfilPermissaoAvisoTexto,
    marginBottom: 4,
  },

  // Texto do valor em estado desabilitado
  disabledText: {
    fontSize: 14,
    color: COLORS.perfilPermissaoAvisoValor,
  },
});
