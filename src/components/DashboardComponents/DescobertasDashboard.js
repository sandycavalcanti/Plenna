import { styles } from "./DescobertasDashboard.styles";
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileCard from '../ProfileComponents/ProfileCard';
import { apresentarMesHome } from '../../utils/periodoHome';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';
const {
  colors: COLORS,
  spacing: SPACING,
  radius: RADIUS
} = DASHBOARD_THEME;
function getDiscoveryIcon(discovery) {
  const description = `${discovery?.titulo || ''} ${discovery?.informacao || ''}`.toLowerCase();
  if (description.includes('recorr')) return 'repeat';
  if (description.includes('categor')) return 'tag-outline';
  return 'chart-line';
}
export default function DescobertasDashboard({
  dados,
  onOpen
}) {
  const items = (dados?.descobertas || []).filter(d => d.tipo === 'REGISTRADO' && d.evidencias?.length).slice(0, 2);
  if (!items.length) return null;
  return <ProfileCard title="Padrões observados" variant="dashboard">
      <View style={styles.periodRow}>
        <MaterialCommunityIcons name="calendar-month-outline" size={16} color={COLORS.muted} />
        <Text style={styles.periodText}>{apresentarMesHome(dados.periodo)}</Text>
      </View>
      {items.map(d => <View key={d.id} style={styles.discoveryItem}>
          <View style={styles.discoveryIcon}>
            <MaterialCommunityIcons name={getDiscoveryIcon(d)} size={20} color={COLORS.accent} />
          </View>
          <View style={styles.discoveryCopy}>
            <Text style={styles.discoveryTitle}>{d.titulo}</Text>
            <Text style={styles.discoveryDescription}>{d.informacao}</Text>
          </View>
        </View>)}
      <Pressable accessibilityRole="button" accessibilityHint="Abre as compras relacionadas ao período" onPress={onOpen} style={styles.relatedAction}>
        <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.accent} />
        <Text style={styles.relatedActionText}>
          Ver compras relacionadas ao período
        </Text>
      </Pressable>
    </ProfileCard>;
}
