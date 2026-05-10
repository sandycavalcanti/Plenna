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
import { useNavigation } from '@react-navigation/native';
import ProfileCard from '../ProfileCard';
import styles from './styles';

function formatarTelefone(digitos) {
  const numeros = String(digitos || '').replace(/\D/g, '');
  if (!numeros || numeros.length !== 11) {
    return digitos;
  }
  const ddd = numeros.slice(0, 2);
  const parte1 = numeros.slice(2, 7);
  const parte2 = numeros.slice(7);
  return `(${ddd}) ${parte1}-${parte2}`;
}

function formatarData(valor) {
  if (!valor) return '';
  let texto = String(valor);
  if (texto.includes('T')) {
    texto = texto.split('T')[0];
  }
  if (texto.includes('-')) {
    const [ano, mes, dia] = texto.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return texto;
}
/**
 * Componente: PersonalInfo
 * Responsabilidade: Renderizar dados pessoais do usuário de forma estruturada
 */
export default function PersonalInfo({ email, telefone, dataNascimento }) {
  const navigation = useNavigation();

  return (
    // Card principal que encapsula as informações pessoais
    <ProfileCard title="Informações pessoais" onEdit={() => navigation.navigate('EditProfile', { mode: 'info' })}>
      {/* Informação: E-mail */}
      <Text style={styles.text}>
        <Text style={styles.fieldLabel}>E-mail:</Text> <Text style={styles.fieldValue}>{email}</Text>
      </Text>

      {/* Informação: Telefone */}
      {telefone && (
        <Text style={styles.text}>
          <Text style={styles.fieldLabel}>Telefone:</Text> <Text style={styles.fieldValue}>{formatarTelefone(telefone)}</Text>
        </Text>
      )}

      {/* Campo desabilitado: Data de nascimento */}
      {dataNascimento && (
        <View style={styles.disabledField}>
          <Text style={styles.label}>Data de nascimento</Text>
          <Text style={styles.disabledText}>{formatarData(dataNascimento)}</Text>
        </View>
      )}
    </ProfileCard>
  );
}
