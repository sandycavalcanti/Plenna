import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileCard from '../ProfileComponents/ProfileCard';
import { styles as categoryStyles } from '../DashboardComponents/Categoria/styles';
import { usageTimeLabel } from '../../utils/usageMonitoringView';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';
import { styles } from './styles';
import AppEmptyState from '../Common/AppEmptyState';

// Apresentação comum às leituras v2 e anteriores; não coleta nem sincroniza dados.
export default function UsageTimeCard({
  compact = false,
  scope,
  total = null,
  apps = [],
  updated,
  state,
  onRetry,
  onSettings,
  onDetails
}) {
  const [expanded, setExpanded] = useState(false);
  const [durationWidth, setDurationWidth] = useState(0);
  useEffect(() => {
    setExpanded(false);
    setDurationWidth(0);
  }, [scope]);
  const recorded = Number.isFinite(total) && total > 0 ? apps.filter(app => Number.isFinite(app.seconds) && app.seconds > 0).slice().sort((a, b) => b.seconds - a.seconds) : [];
  const denominator = recorded.reduce((sum, app) => sum + app.seconds, 0);
  const top = recorded[0];
  const visible = expanded ? recorded : recorded.slice(0, 4);
  const action = state?.action === 'PROFILE' ? onSettings : onRetry;
  const paused = state?.kind === 'PAUSED';
  let message = state?.message;
  if (paused) {
    message = total == null ? 'Tempo registrado indisponível.' : null;
  } else if (state?.kind === 'SYNCING') {
    message = total == null ? 'Carregando tempo registrado…' : null;
  }
  return <View style={[categoryStyles.section, compact && styles.compactSection]} testID="usage-time-card">
    <ProfileCard title={compact ? 'Tempo em aplicativos · hoje' : 'Tempo em aplicativos'} titleIcon={compact ? 'clock-outline' : null} variant="dashboard">
      {total != null && <View style={[styles.summary, compact && styles.todaySummary]} testID={compact ? 'usage-today-highlight' : 'usage-month-summary'}>
        <Text style={[styles.caption, compact && styles.todayCaption]}>{compact ? 'TEMPO REGISTRADO HOJE' : 'Tempo registrado no mês'}</Text>
        <Text style={[styles.total, compact && styles.compactTotal]} testID="usage-total">{usageTimeLabel(total)}</Text>
      </View>}
      {compact && state?.kind === 'EMPTY' ? <AppEmptyState
        icon="clock-outline"
        title="Nenhum tempo registrado hoje"
        description="Seus dados de uso aparecerão aqui quando estiverem disponíveis."
        compact
        circleIcon
      /> : null}
      {message && !(compact && state?.kind === 'EMPTY') && <View style={styles.statusRow}>
        {['LOADING', 'SYNCING'].includes(state.kind) && <ActivityIndicator size="small" accessibilityLabel={message} />}
        <Text style={styles.status} testID="usage-main-message" accessibilityLiveRegion="polite">{message}</Text>
      </View>}
      {top && (compact ? <View style={styles.compactTop} testID="usage-top-app">
        <View style={styles.topCopy}><Text style={styles.caption}>Aplicativo mais utilizado</Text><Text style={styles.featuredName}>{top.label}</Text></View>
        <Text style={styles.durationPill}>{usageTimeLabel(top.seconds)}</Text>
      </View> : <View style={categoryStyles.summaryCard} testID="usage-top-app">
        <View style={categoryStyles.summaryCopy}><Text style={categoryStyles.summaryLabel}>MAIS UTILIZADO</Text><Text style={categoryStyles.summaryValue}>{top.label}</Text></View>
        <Text style={styles.durationPill}>{usageTimeLabel(top.seconds)}</Text>
      </View>)}
      {!compact && Number.isFinite(denominator) && denominator > 0 && <View style={styles.chart} testID="usage-app-chart">
        <Text style={styles.chartTitle}>Tempo por aplicativo</Text>
        {visible.map(item => {
          const percent = item.seconds / denominator * 100;
          const label = `${Number(percent.toFixed(1)).toLocaleString('pt-BR')}%`;
          return <View key={item.label} style={styles.barItem} accessible accessibilityLabel={`${item.label}: ${label}, ${usageTimeLabel(item.seconds)} de tempo registrado`}>
            <View style={styles.barCopy}>
              <View style={styles.barHeading}><Text style={styles.barLabel}>{item.label}</Text><Text style={styles.percent}>{label}</Text></View>
              <View style={styles.barTrack}><View testID="usage-app-bar" style={[styles.barFill, {
                  width: `${percent}%`
                }]} /></View>
            </View>
            <Text style={[styles.barValue, {
              minWidth: durationWidth
            }]} onLayout={event => {
              const width = Math.ceil(event.nativeEvent.layout.width);
              if (Number.isFinite(width)) setDurationWidth(current => Math.max(current, width));
            }}>{usageTimeLabel(item.seconds)}</Text>
          </View>;
        })}
      </View>}
      {!compact && recorded.length > 4 && <Pressable style={styles.action} accessibilityRole="button" accessibilityState={{
        expanded
      }} onPress={() => setExpanded(!expanded)}><Text style={styles.actionText}>{expanded ? 'Recolher aplicativos' : 'Ver todos'}</Text></Pressable>}
      {(updated || compact && onDetails) && <View style={styles.footer}>
        {updated && <Text style={styles.updated}>{updated}</Text>}
        {compact && onDetails && <Pressable style={styles.details} accessibilityRole="button" accessibilityLabel="Ver detalhes do tempo em aplicativos no Dashboard" onPress={onDetails}><Text style={styles.actionText}>Ver detalhes</Text><MaterialCommunityIcons name="chevron-right" size={20} color={DASHBOARD_THEME.colors.navy} /></Pressable>}
      </View>}
      {!paused && state?.action && action && <Pressable style={styles.action} accessibilityRole="button" onPress={action}><Text style={styles.actionText}>{state.action === 'PROFILE' ? 'Ver no Perfil' : 'Tentar novamente'}</Text></Pressable>}
    </ProfileCard>
  </View>;
}
