/**
 * Arquivo: PersonalInfo/index.js
 * Descrição: Componente responsável por exibir as informações pessoais do usuário,
 * como e-mail, telefone, data de nascimento e ocupação.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importações necessárias para o componente
import React from 'react';
import { View, Text } from 'react-native';
import ProfileCard from '../ProfileCard';
import styles from './styles';

/**
 * Componente: PersonalInfo
 * Responsabilidade: Renderizar dados pessoais do usuário de forma estruturada
 */
export default function PersonalInfo() {
  return (
    // Card principal que encapsula as informações pessoais
    <ProfileCard title="Informações pessoais" onEdit={() => {}}>

      {/* Informação: E-mail */}
      <Text style={styles.text}>
        Email: marina@email.com
      </Text>

      {/* Informação: Telefone */}
      <Text style={styles.text}>
        Telefone: (11) 99999-9999
      </Text>

      {/* Campo desabilitado: Data de nascimento */}
      <View style={styles.disabledField}>
        <Text style={styles.label}>
          Data de nascimento
        </Text>

        <Text style={styles.disabledText}>
          10/10/2000
        </Text>
      </View>

      {/* Informação: Ocupação */}
      <Text style={styles.text}>
        Ocupação: Estudante
      </Text>

    </ProfileCard>
  );
}