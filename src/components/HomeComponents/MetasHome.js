import React, { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import CustomButton from '../CustomButton';
import MetaSummaryCard from '../Metas/MetaSummaryCard';

const Icon = typeof MaterialCommunityIcons === 'undefined' ? View : MaterialCommunityIcons;

export default function MetasHome({ metas = [], loading, error, onRetry, onCreate, onOpen, periodo, periodoAtual }) {
  const [all, setAll] = useState(false);
  const isCurrentPeriod = periodoAtual ? periodo === periodoAtual : true;

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Icon name="flag-checkered" size={20} color={COLORS.metaProgressFill} />
        </View>
        <Text style={styles.sectionTitle}>Minhas metas</Text>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator accessibilityLabel="Carregando metas" color={COLORS.metaProgressFill} />
        </View>
      ) : error ? (
        <View style={styles.messageState}>
          <Text style={styles.message}>Não foi possível consultar suas metas.</Text>
          <CustomButton title="Tentar novamente" variant="outline" onPress={onRetry} style={styles.action} />
        </View>
      ) : metas.length === 0 ? (
        <View style={[styles.messageState, styles.emptyState]}>
          <View style={styles.emptyIcon}>
            <Icon name="flag-outline" size={24} color={COLORS.metaProgressFill} />
          </View>
          <Text style={styles.emptyTitle}>
            {isCurrentPeriod ? 'Sua próxima conquista começa aqui!' : 'Nenhuma meta neste período'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isCurrentPeriod ? 'Crie uma meta e comece a acompanhar seu progresso.' : 'Você ainda não tinha metas registradas nesse mês.'}
          </Text>
          {isCurrentPeriod ? <CustomButton title="+ Criar meta" variant="primary" onPress={onCreate} style={[styles.action, styles.createAction]} /> : null}
        </View>
      ) : (
        <View style={styles.metasList}>
          {(all ? metas : metas.slice(0, 2)).map((meta) => (
            <MetaSummaryCard key={meta.id ?? meta.meta_id} meta={meta} onOpen={onOpen} />
          ))}
          {metas.length > 2 ? (
            <CustomButton
              title={all ? 'Mostrar menos' : `Ver as ${metas.length} metas`}
              variant="ghost"
              accessibilityState={{ expanded: all }}
              onPress={() => setAll(!all)}
              style={styles.action}
            />
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
    backgroundColor: COLORS.buttonSecondaryBackground,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.cadTitulo,
  },
  metasList: { gap: 10 },
  loadingState: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageState: { gap: 4 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.buttonSecondaryBackground,
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: COLORS.cadTitulo,
    textAlign: 'center',
  },
  emptySubtitle: {
    maxWidth: 280,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.dadoUm,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.dadoUm,
  },
  action: {
    minHeight: 44,
    width: 'auto',
    alignSelf: 'flex-start',
  },
  createAction: {
    alignSelf: 'center',
    marginTop: 4,
  },
};
