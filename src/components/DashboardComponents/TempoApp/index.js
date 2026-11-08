import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import AppEmptyState from '../../Common/AppEmptyState';
import { styles } from './styles';
import { COLORS } from '../../../constants';
import { obterJanelaDiaLocal } from '../../../utils/tempoUsoSync';
import { filtrarHistoricoUso, dataLocalRegistroUso } from '../../../utils/historicoTempoUso';
import { usageLegacyMetrics, usageTimeLabel } from '../../../utils/usageMonitoringView';

function formatMinutes(totalMinutes) {
  const seconds = Math.max(0, Math.round(Number(totalMinutes) * 60));
  return usageTimeLabel(seconds);
}

export default function TempoApp({
  tempoUso = [],
  title = 'Tempo em aplicativos de compras',
  mes = obterJanelaDiaLocal().dataLocal.slice(0, 7),
  loading = false,
  error = false,
  onRetry,
}) {
  const [expanded, setExpanded] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const today = obterJanelaDiaLocal().dataLocal;

  // O monitoramento pode entregar histórico mensal e registros futuros por
  // diferença de relógio. A apresentação mantém apenas o período solicitado
  // e datas já ocorridas, sem inventar cobertura para o mês atual.
  const rows = useMemo(
    () => filtrarHistoricoUso(tempoUso, mes).filter((row) => {
      const localDate = dataLocalRegistroUso(row);
      return localDate && localDate <= today;
    }),
    [tempoUso, mes, today],
  );
  const metrics = useMemo(() => usageLegacyMetrics(rows), [rows]);
  const items = useMemo(
    () => (metrics.apps || []).map((item) => ({ label: item.label, value: item.seconds / 60 })),
    [metrics.apps],
  );
  const totalMinutes = Number.isFinite(metrics.total) ? metrics.total / 60 : 0;
  const topItem = items[0];
  const displayedItems = expanded ? items : items.slice(0, 3);
  const colors = [COLORS.dadoDois, COLORS.dadoTres, COLORS.dadoUm, COLORS.customButtonFundo];
  const getItemColor = (index) => colors[index % colors.length];

  if (loading || error || (rows.length > 0 && metrics.total == null)) {
    return (
      <View style={styles.section}>
        <ProfileCard title={title} variant="dashboard">
          <AppEmptyState
            icon={loading ? 'clock-outline' : 'clock-alert-outline'}
            title={loading ? 'Carregando registros...' : 'Tempo indisponível.'}
            description={error ? 'Não foi possível carregar este período.' : 'A cobertura deste período não permite calcular o total com segurança.'}
            actionLabel={error && onRetry ? 'Tentar novamente' : undefined}
            onAction={onRetry}
            compact
          />
        </ProfileCard>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.section}>
        <ProfileCard title={title} variant="dashboard">
          <AppEmptyState icon="clock-outline" title="Nenhum tempo registrado neste período." compact />
        </ProfileCard>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <ProfileCard title={title} variant="dashboard">
        <View style={styles.summaryCard}>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryLabel}>Maior tempo registrado</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>{topItem?.label || 'Sem dados'}</Text>
          </View>
          <View style={styles.summaryBadge}>
            <MaterialCommunityIcons name="clock-outline" size={22} color={COLORS.dashboardBoxMaiorTempoBorda} />
            <Text style={styles.summaryBadgeText}>{formatMinutes(topItem?.value)}</Text>
          </View>
        </View>

        <Text style={{ color: '#655A70', fontSize: 13, lineHeight: 19, marginVertical: 10 }}>
          Tempo registrado no mês: {formatMinutes(totalMinutes)} em {items.length} aplicativo(s) monitorado(s).
        </Text>
        <View style={{ backgroundColor: '#FAF7FC', borderRadius: 14, padding: 12, marginBottom: 12 }}>
          <Text style={{ fontWeight: '600', color: '#4A4E7A' }}>Observe seu tempo</Text>
          <Text style={{ color: '#655A70', lineHeight: 19 }}>{topItem.label} teve a maior participação no tempo observado.</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: showTip }} onPress={() => setShowTip(!showTip)} style={{ minHeight: 48, justifyContent: 'center' }}>
            <Text style={{ color: '#893467', fontWeight: '600' }}>{showTip ? 'Recolher dica' : 'Uma dica para a próxima visita'}</Text>
          </TouchableOpacity>
          {showTip && <Text style={{ color: '#655A70', lineHeight: 19 }}>Sugestão opcional: escolha o que pretende procurar antes de abrir {topItem.label} novamente.</Text>}
        </View>
        <View style={styles.rankList}>
          {displayedItems.map((item, index) => {
            const color = getItemColor(index);
            const share = totalMinutes > 0 ? Math.round((item.value / totalMinutes) * 100) : 0;
            return (
              <View key={`${item.label}-${index}`} style={styles.rankItem}>
                <View style={[styles.rankPosition, { backgroundColor: `${color}18` }]}><Text style={[styles.rankPositionText, { color }]}>{index + 1}</Text></View>
                <View style={styles.rankContent}>
                  <View style={styles.rankTopRow}>
                    <Text style={styles.rankLabel} numberOfLines={1}>{item.label}</Text>
                    <Text style={styles.rankValue}>{formatMinutes(item.value)}</Text>
                  </View>
                  <View style={styles.rankTrack}>
                    <View testID="usage-app-bar" style={[styles.rankFill, { width: `${(totalMinutes > 0 ? item.value / totalMinutes : 0) * 100}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={styles.rankShare}>{share}% do total</Text>
                </View>
              </View>
            );
          })}
        </View>
        {items.length > 3 && (
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded }} style={styles.expandButton} onPress={() => setExpanded(!expanded)}>
            <Text style={styles.expandButtonText}>{expanded ? 'Recolher' : `Ver mais (${items.length - 3})`}</Text>
            <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.dadoDois} />
          </TouchableOpacity>
        )}
      </ProfileCard>
    </View>
  );
}
