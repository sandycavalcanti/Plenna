/**
 * Arquivo: ProfileCard/styles.js
 * Descrição: Estilos do componente ProfileCard, responsáveis pela
 * estrutura visual do card, incluindo bordas, cabeçalho e organização do conteúdo interno.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importação do módulo de estilos do React Native
import { StyleSheet } from 'react-native';

/**
 * Objeto de estilos do componente
 * Define layout, espaçamento, tipografia e aparência geral do card
 */
export default StyleSheet.create({

  // Container principal do card
  container: {
    borderWidth: 1.5,
    borderColor: '#6C63FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },

  // Cabeçalho com título e botão de ação
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  // Estilo do título do card
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C63FF',
  },

  // Container do conteúdo interno
  content: {
    gap: 10,
  },

});

