/**
 * Arquivo: ProfileScreen/styles.js
 * Descrição: Estilos da tela ProfileScreen, responsáveis pela
 * definição do layout geral, espaçamento e cor de fundo da tela.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importação do módulo de estilos do React Native

/**
 * Objeto de estilos da tela
 * Define estrutura base e aparência do container principal
 */
import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  // Container principal da tela de perfil
  container: {
    flex: 1,
    backgroundColor: COLORS.fundoPrincipal,
    marginBottom: 10,
  },

  accountActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },

  accountActionWrapper: {
    position: 'relative',
    alignItems: 'flex-end',
    zIndex: 20,
  },

  accountActionButton: {
    padding: 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },

  accountActionButtonDisabled: {
    opacity: 0.55,
  },

  accountDropdown: {
    position: 'absolute',
    top: 48,
    right: 0,
    minWidth: 182,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(131, 111, 226, 0.18)',
    shadowColor: '#1E245A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    paddingVertical: 6,
  },

  accountDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  accountDropdownText: {
    color: COLORS.cadTitulo,
    fontSize: 14,
    fontWeight: '600',
  },

  accountDropdownTextDanger: {
    color: '#A31414',
  },

  accountDropdownDivider: {
    height: 1,
    backgroundColor: 'rgba(131, 111, 226, 0.12)',
    marginHorizontal: 10,
  },

  // Estilos aplicados ao conteúdo rolável da tela
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 50,
  },
});
