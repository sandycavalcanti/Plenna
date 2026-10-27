import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileCard from '../ProfileComponents/ProfileCard';
import { apresentarMesHome } from '../../utils/periodoHome';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';

const { colors: COLORS, spacing: SPACING, radius: RADIUS } = DASHBOARD_THEME;

function getDiscoveryIcon(discovery) {
  const description = `${discovery?.titulo || ''} ${discovery?.informacao || ''}`.toLowerCase();
  if (description.includes('recorr')) return 'repeat';
  if (description.includes('categor')) return 'tag-outline';
  return 'chart-line';
}

export default function DescobertasDashboard({ dados, onOpen }) {
  const items = (dados?.descobertas || [])
    .filter((d) => d.tipo === 'REGISTRADO' && d.evidencias?.length)
    .slice(0, 2);
  if (!items.length) return null;
  return (
    <ProfileCard title="Padrões observados" variant="dashboard">
      <View style={styles.periodRow}>
        <MaterialCommunityIcons name="calendar-month-outline" size={16} color={COLORS.muted} />
        <Text style={styles.periodText}>{apresentarMesHome(dados.periodo)}</Text>
      </View>
      {items.map((d) => (
        <View key={d.id} style={styles.discoveryItem}>
          <View style={styles.discoveryIcon}>
            <MaterialCommunityIcons name={getDiscoveryIcon(d)} size={20} color={COLORS.accent} />
          </View>
          <View style={styles.discoveryCopy}>
            <Text style={styles.discoveryTitle}>{d.titulo}</Text>
            <Text style={styles.discoveryDescription}>{d.informacao}</Text>
          </View>
        </View>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Abre as compras relacionadas ao período"
        onPress={onOpen}
        style={styles.relatedAction}
      >
        <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.accent} />
        <Text style={styles.relatedActionText}>
          Ver compras relacionadas ao período
        </Text>
      </Pressable>
    </ProfileCard>
  );
}

const styles = StyleSheet.create({
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  discoveryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  discoveryIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentSoft,
  },
  discoveryCopy: {
    flex: 1,
    gap: SPACING.xs,
    paddingTop: 1,
  },
  discoveryTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    color: COLORS.ink,
  },
  discoveryDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.body,
  },
  relatedAction: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  relatedActionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: COLORS.accent,
  },
});
