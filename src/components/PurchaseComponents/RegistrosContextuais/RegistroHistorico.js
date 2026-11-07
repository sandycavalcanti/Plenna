import { styles } from "./RegistroHistorico.styles";
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';
import { dataHistorico } from './apresentacao';
const c = DASHBOARD_THEME.colors;
export function LinhaHistorica({
  label,
  value,
  icone,
  antes
}) {
  return <View style={styles.line}>
    <Ionicons name={icone ?? 'information-circle-outline'} size={19} color={c.navy} accessible={false} />
    <View style={styles.copy}><View style={styles.values}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>
      {antes != null && <Text style={styles.caption}>Antes: {antes}</Text>}
    </View>
  </View>;
}
export default function RegistroHistorico({
  data,
  estado,
  icone,
  expanded,
  onToggle,
  label,
  alteracoes,
  preview,
  statusNote,
  children
}) {
  return <View style={styles.card}>
    <Pressable accessibilityRole="button" accessibilityLabel={[label, dataHistorico(data), estado, statusNote, alteracoes ? `${alteracoes} alterações` : null].filter(Boolean).join(' · ')} accessibilityState={{
      expanded
    }} onPress={onToggle} style={styles.header}>
      <Ionicons name={icone} size={21} color={c.navy} accessible={false} />
      <View style={styles.copy}><Text style={styles.date}>{dataHistorico(data)}</Text>
        {statusNote && <Text style={styles.caption}>{statusNote}</Text>}
        {!!alteracoes && <Text style={styles.caption}>{alteracoes} {alteracoes === 1 ? 'alteração' : 'alterações'}</Text>}
      </View>
      <Text style={styles.badge}>{estado}</Text><Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={19} color={c.navy} accessible={false} />
    </Pressable>
    {!expanded && preview && <Text style={styles.preview} numberOfLines={2}>{preview}</Text>}
    {expanded && <View style={styles.body}>{children}</View>}
  </View>;
}
