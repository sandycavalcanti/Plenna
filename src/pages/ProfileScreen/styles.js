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

  // Estilos aplicados ao conteúdo rolável da tela
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 50,
  },
});
