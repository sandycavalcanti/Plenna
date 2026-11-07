import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import ProfileCard from '../ProfileCard';
import styles from './styles';
import { COLORS } from '../../../constants';

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

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon} accessibilityElementsHidden>
        <Feather name={icon} size={15} color={COLORS.ink} />
      </View>
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
      icon="user"
      variant="profile"
      actionIcon="edit-2"
      actionAccessibilityLabel="Editar dados pessoais"
      onEdit={() => navigation.navigate('EditProfile', { mode: 'info' })}
    >
      <InfoRow icon="mail" label="E-mail" value={email} />
      <InfoRow icon="phone" label="Telefone" value={telefone ? formatarTelefone(telefone) : null} />
      <InfoRow icon="calendar" label="Data de nascimento" value={dataNascimento ? formatarData(dataNascimento) : null} />
    </ProfileCard>
  );
}
