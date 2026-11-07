import React from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../constants';
import styles from './styles';

function getInitials(nome) {
  const words = String(nome ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
}

export default function ProfileHeader({ nome, email, rightAction }) {
  const displayName = String(nome ?? '').trim();
  const displayEmail = String(email ?? '').trim();
  const initials = getInitials(displayName);

  return (
    <View style={styles.container}>
      <View style={styles.identityRow}>
        <View style={styles.avatar} accessibilityLabel="Identificação do usuário">
          {initials ? <Text style={styles.initials}>{initials}</Text> : <Feather name="user" size={22} color={COLORS.metaProgressFill} />}
        </View>
        <View style={styles.identityCopy}>
          <Text style={styles.name} numberOfLines={2}>{displayName || 'Nome não informado'}</Text>
          {displayEmail ? <Text style={styles.email} numberOfLines={2}>{displayEmail}</Text> : <Text style={styles.muted}>E-mail não informado</Text>}
        </View>
        {rightAction ? <View style={styles.action}>{rightAction}</View> : null}
      </View>
    </View>
  );
}
