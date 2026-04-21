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

  // Wrapper para permitir posicionamento do botão de edição sobre o avatar
  avatarWrapper: {
    position: 'relative',
  },

  // Estilo do avatar (imagem de perfil ou placeholder)
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#991414',
  },

  // Botão com ícone para editar imagem de perfil
  editAvatarButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#4652A4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F7F7FB',
  },

  // Estilo do nome do usuário
  name: {
    fontFamily: 'SugoDisplay',
    marginTop: 10,
    fontSize: 35,
    fontWeight: '600',
    color: '#595D7C',
  },
});
