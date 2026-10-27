import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatarValorMoedaParaTela } from '../CustomTextInput/currency';

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

function formatGoalValue(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return 'Valor não informado';
  }

  return formatarValorMoedaParaTela(value);
}

function formatGoalDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function renderGoalCard(goal) {
  const completed = goal.concluida === true;
  const date = formatGoalDate(goal.data);

  return (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <View style={styles.goalIcon}>
          <Icon name="target" size={20} color={COLORS.accent} />
        </View>
        <View style={styles.goalCopy}>
          <Text style={styles.goalName} numberOfLines={2}>{goal.nome}</Text>
          <View style={[styles.statusBadge, completed ? styles.completedBadge : styles.activeBadge]}>
            <View style={[styles.statusDot, completed ? styles.completedDot : styles.activeDot]} />
            <Text style={[styles.statusText, completed ? styles.completedText : styles.activeText]}>
              {completed ? 'Marcada como concluída' : 'Em acompanhamento'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.goalDetails}>
        <View style={styles.goalDetail}>
          <Text style={styles.goalDetailLabel}>Objetivo</Text>
          <Text style={styles.goalValue}>{formatGoalValue(goal.valor)}</Text>
          <Text style={styles.goalNote}>A meta não registra aportes.</Text>
        </View>
        {date ? (
          <View style={styles.goalDate}>
            <Icon name="calendar-outline" size={16} color={COLORS.muted} />
            <Text style={styles.goalDateText}>{date}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function MetasHome({ metas = [], loading, error, onRetry, onCreate }) {
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
        <View style={styles.goalsList}>
          {(all ? metas : metas.slice(0, 2)).map((goal) => (
            <View key={goal.id}>
              {renderGoalCard(goal)}
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
  goalsList: {
    gap: 10,
  },
  goalCard: {
    padding: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
    gap: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  goalIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  goalCopy: {
    flex: 1,
    gap: 7,
  },
  goalName: {
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
  goalDetails: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  goalDetail: {
    flex: 1,
    gap: 2,
  },
  goalDetailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  goalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.accent,
  },
  goalNote: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.muted,
  },
  goalDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingBottom: 2,
  },
  goalDateText: {
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
