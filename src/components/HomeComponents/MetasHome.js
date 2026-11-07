import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatarValorMeta, formatarPercentualMeta } from '../../utils/metaMoney';

const Icon = typeof MaterialCommunityIcons === 'undefined' ? View : MaterialCommunityIcons;

const COLORS = {
  surface: '#FFFFFF',
  surfaceMuted: '#FAF7FC',
  ink: '#594367',
  body: '#655A70',
  muted: '#8F8398',
  accent: '#893467',
  accentSoft: '#F3EEF9',
  positive: '#4F8D7A',
  positiveSoft: '#EAF5F0',
  completed: '#76658A',
  completedSoft: '#F0EDF7',
  border: '#ECE8F4',
};

function formatarValorExibicaoMeta(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return 'Valor não informado';
  }

  return formatarValorMeta(value) || 'Valor não informado';
}

function formatarDataMeta(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function renderMetaCard(meta, onOpen) {
  const completed = meta.concluida === true;
  const date = formatarDataMeta(meta.data);
  const percent = formatarPercentualMeta(meta.progressoPercentual);
  const progressWidth = percent === null ? 0 : Math.min(100, Math.max(0, Number(meta.progressoPercentual)));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir detalhes da meta ${meta.nome}`}
      onPress={() => onOpen?.(meta)}
      style={styles.metaCard}
    >
      <View style={styles.metaHeader}>
        <View style={styles.metaIcon}>
          <Icon name="target" size={20} color={COLORS.accent} />
        </View>
        <View style={styles.metaCopy}>
          <Text style={styles.metaName} numberOfLines={2}>{meta.nome}</Text>
          <View style={[styles.statusBadge, completed ? styles.completedBadge : styles.activeBadge]}>
            <View style={[styles.statusDot, completed ? styles.completedDot : styles.activeDot]} />
            <Text style={[styles.statusText, completed ? styles.completedText : styles.activeText]}>
              {completed ? 'Marcada como concluída' : 'Em acompanhamento'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.metaDetails}>
        <View style={styles.metaDetail}>
          <Text style={styles.metaDetailLabel}>Objetivo</Text>
          <Text style={styles.metaValue}>{formatarValorExibicaoMeta(meta.valor)}</Text>
          {meta.valorReservado !== undefined && meta.valorReservado !== null ? <Text style={styles.metaNote}>Reservado: {formatarValorExibicaoMeta(meta.valorReservado)}</Text> : null}
          {percent !== null ? <Text style={styles.metaNote}>Progresso: {percent}</Text> : null}
        </View>
        {date ? (
          <View style={styles.metaDate}>
            <Icon name="calendar-outline" size={16} color={COLORS.muted} />
            <Text style={styles.metaDateText}>{date}</Text>
          </View>
        ) : null}
      </View>
      {percent !== null ? (
        <View accessible accessibilityLabel={`Progresso da meta: ${percent}`} style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressWidth}%` }]} />
        </View>
      ) : null}
    </Pressable>
  );
}

export default function MetasHome({ metas = [], loading, error, onRetry, onCreate, onOpen }) {
  const [all, setAll] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Icon name="flag-checkered" size={20} color={COLORS.accent} />
        </View>
        <Text style={styles.sectionTitle}>Minhas metas</Text>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator accessibilityLabel="Carregando metas" color={COLORS.accent} />
        </View>
      ) : error ? (
        <View style={styles.messageState}>
          <Text style={styles.message}>Não foi possível consultar suas metas.</Text>
          <Pressable onPress={onRetry} accessibilityRole="button" style={styles.action}>
            <Text style={styles.actionText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : metas.length === 0 ? (
        <View style={styles.messageState}>
          <Text style={styles.message}>Qual objetivo você quer acompanhar?</Text>
          <Pressable onPress={onCreate} accessibilityRole="button" style={styles.action}>
            <Text style={styles.actionText}>Criar uma meta</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.metasList}>
          {(all ? metas : metas.slice(0, 2)).map((meta) => (
            <View key={meta.id}>
              {renderMetaCard(meta, onOpen)}
            </View>
          ))}
          {metas.length > 2 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: all }}
              onPress={() => setAll(!all)}
              style={styles.action}
            >
              <Text style={styles.actionText}>{all ? 'Mostrar menos' : `Ver as ${metas.length} metas`}</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = {
  card: {
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentSoft,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
  },
  metasList: {
    gap: 10,
  },
  metaCard: {
    padding: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
    gap: 12,
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  metaIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  metaCopy: {
    flex: 1,
    gap: 7,
  },
  metaName: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    color: COLORS.ink,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activeBadge: {
    backgroundColor: COLORS.positiveSoft,
  },
  completedBadge: {
    backgroundColor: COLORS.completedSoft,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: COLORS.positive,
  },
  completedDot: {
    backgroundColor: COLORS.completed,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeText: {
    color: COLORS.positive,
  },
  completedText: {
    color: COLORS.completed,
  },
  metaDetails: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  metaDetail: {
    flex: 1,
    gap: 2,
  },
  metaDetailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.accent,
  },
  metaNote: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.muted,
  },
  progressTrack: {
    height: 7,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: COLORS.accent,
  },
  metaDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingBottom: 2,
  },
  metaDateText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  loadingState: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageState: {
    gap: 4,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.body,
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
  },
};
