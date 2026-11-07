import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProfileCard from '../ProfileCard';
import styles from './styles';

function formatarTelefone(digitos) {
  const numeros = String(digitos || '').replace(/\D/g, '');
  if (!numeros || numeros.length !== 11) return digitos;
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

function formatarData(valor) {
  if (!valor) return '';
  let texto = String(valor).split('T')[0];
  if (texto.includes('-')) {
    const [ano, mes, dia] = texto.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return texto;
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={2}>{value || 'Não informado'}</Text>
    </View>
  );
}

export default function PersonalInfo({ email, telefone, dataNascimento }) {
  const navigation = useNavigation();

  return (
    <ProfileCard
      title="Dados pessoais"
      variant="profile"
      actionLabel="Editar"
      onEdit={() => navigation.navigate('EditProfile', { mode: 'info' })}
    >
      <InfoRow label="E-mail" value={email} />
      <InfoRow label="Telefone" value={telefone ? formatarTelefone(telefone) : null} />
      <InfoRow label="Data de nascimento" value={dataNascimento ? formatarData(dataNascimento) : null} />
    </ProfileCard>
  );
}
