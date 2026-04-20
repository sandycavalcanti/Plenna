/**
 * Arquivo: ProfileHeader/styles.js
 * Descrição: Estilos do componente ProfileHeader, responsáveis pela
 * organização visual do cabeçalho do perfil, incluindo avatar e nome do usuário.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importação do módulo de estilos do React Native
import { StyleSheet } from 'react-native';

/**
 * Objeto de estilos do componente
 * Define alinhamento, dimensões e tipografia do cabeçalho
 */
export default StyleSheet.create({

  // Container principal do cabeçalho
  container: {
    alignItems: 'center',
    marginBottom: 20,
  },

  // Estilo do avatar (imagem de perfil ou placeholder)
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E5E5',
  },

  // Estilo do nome do usuário
  name: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '600',
  },

});


