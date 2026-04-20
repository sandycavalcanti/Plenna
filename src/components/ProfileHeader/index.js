/**
 * Arquivo: ProfileHeader/index.js
 * Descrição: Componente responsável por exibir o cabeçalho do perfil do usuário,
 * incluindo avatar e nome.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importações necessárias para o componente
import React from 'react';
import { View, Text } from 'react-native';
import styles from './styles';

/**
 * Componente: ProfileHeader
 * Responsabilidade: Renderizar informações básicas do usuário no topo da tela
 */
export default function ProfileHeader() {
  return (
    // Container principal do cabeçalho
    <View style={styles.container}>

      {/* Avatar do usuário (placeholder visual) */}
      <View style={styles.avatar} />

      {/* Nome do usuário */}
      <Text style={styles.name}>
        Marina Souza
      </Text>

    </View>
  );
}



