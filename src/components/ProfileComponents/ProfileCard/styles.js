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
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(131, 111, 226, 0.52)',
    borderRadius: 16,
    padding: 14,
    paddingTop: 28,
    marginTop: 10,
    marginBottom: 16,
  },

  // Cabeçalho com título e botão de ação
  header: {
    position: 'absolute',
    top: -13,
    left: 12,
    right: 12,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Fundo para recortar visualmente a borda atrás do título
  titleWrapper: {
    paddingHorizontal: 8,
    backgroundColor: '#F7F7FB',
  },

  // Fundo para recortar visualmente a borda atrás do ícone de edição
  editButton: {
    paddingHorizontal: 6,
    backgroundColor: '#F7F7FB',
  },

  // Estilo do título do card
  title: {
    fontSize: 17,
    fontWeight: '500',
    color: '#4652A4',
  },

  // Container do conteúdo interno
  content: {
    gap: 10,
  },
});
