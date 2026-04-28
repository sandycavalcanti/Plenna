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
export default function PersonalInfo({ email, telefone, dataNascimento }) {
  return (
    // Card principal que encapsula as informações pessoais
    <ProfileCard title="Informações pessoais" onEdit={() => {}}>
      {/* Informação: E-mail */}
      <Text style={styles.text}>
        <Text style={styles.fieldLabel}>E-mail:</Text> <Text style={styles.fieldValue}>{email}</Text>
      </Text>

      {/* Informação: Telefone */}
      {telefone && (
        <Text style={styles.text}>
          <Text style={styles.fieldLabel}>Telefone:</Text> <Text style={styles.fieldValue}>{telefone}</Text>
        </Text>
      )}

      {/* Campo desabilitado: Data de nascimento */}
      {dataNascimento && (
        <View style={styles.disabledField}>
          <Text style={styles.label}>Data de nascimento</Text>
          <Text style={styles.disabledText}>{dataNascimento}</Text>
        </View>
      )}
    </ProfileCard>
  );
}
