import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Categoria from '../../components/DashboardComponents/Categoria';
import FormaPagamento from '../../components/DashboardComponents/FormaPagamento';
import Impulsividade from '../../components/DashboardComponents/Impulsividade';
import TempoApp from '../../components/DashboardComponents/TempoApp';
import { COLORS } from '../../constants/colors';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';
import { getDashboardAnalytics } from '../../api/dashboard';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { logApiErrors } from '../../utils/error';
import { styles } from './styles';

const ANALYTICS_TIMEZONE = 'America/Sao_Paulo';
const DASHBOARD_COLORS = DASHBOARD_THEME.colors;

function getCurrentMonth() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ANALYTICS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}`;
}

function getMonthInTimezone(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ANALYTICS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}`;
}

function parseMonth(month) {
  const [year, monthNumber] = String(month).split('-').map(Number);
  return { year, month: monthNumber };
}

function shiftMonth(month, amount) {
  const parsed = parseMonth(month);
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function compareMonths(left, right) {
  return parseMonth(left).year * 12 + parseMonth(left).month
    - (parseMonth(right).year * 12 + parseMonth(right).month);
}

function monthLabel(month) {
  const { year, month: monthNumber } = parseMonth(month);
  const value = new Date(Date.UTC(year, monthNumber - 1, 15, 12));
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: ANALYTICS_TIMEZONE,
    month: 'long',
    year: 'numeric',
  }).format(value).replace(/^./, (letter) => letter.toUpperCase());
}

function monthShortLabel(month) {
  const { year, month: monthNumber } = parseMonth(month);
  const value = new Date(Date.UTC(year, monthNumber - 1, 15, 12));
  const shortMonth = new Intl.DateTimeFormat('pt-BR', {
    timeZone: ANALYTICS_TIMEZONE,
    month: 'short',
  }).format(value).replace('.', '');
  return `${shortMonth.slice(0, 3)}/${String(year).slice(-2)}`;
}

function monthName(monthNumber) {
  const value = new Date(Date.UTC(2020, monthNumber - 1, 15, 12));
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: ANALYTICS_TIMEZONE,
    month: 'long',
  }).format(value).replace(/^./, (letter) => letter.toUpperCase());
}

function formatCents(cents) {
  return `R$ ${(Number(cents || 0) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatReais(value) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return 'Sem base de comparação';
  }

  const number = Number(value);
  return `${number > 0 ? '+' : ''}${number.toFixed(2).replace('.', ',')}%`;
}

function formatSignedCents(cents) {
  const number = Number(cents || 0);
  if (number === 0) return formatCents(0);
  return `${number > 0 ? '+' : '-'}${formatCents(Math.abs(number))}`;
}

function formatAxisCents(cents) {
  const reais = Number(cents || 0) / 100;
  if (reais >= 1000) return `R$ ${(reais / 1000).toFixed(1).replace('.', ',')}k`;
  return `R$ ${Math.round(reais).toLocaleString('pt-BR')}`;
}

function buildSmoothPath(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const middleX = (current.x + next.x) / 2;
    path += ` C ${middleX} ${current.y}, ${middleX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

function isCanceled(error) {
  return error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError';
}

function MetricTile({ icon, label, value, caption, color = COLORS.dadoDois }) {
  return (
    <View style={[styles.metricTile, { borderLeftColor: color }]}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <View style={styles.metricCopy}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
        {caption ? <Text style={styles.metricCaption}>{caption}</Text> : null}
      </View>
    </View>
  );
}

function PeriodSelector({ value, onPress, label = 'Período' }) {
  return (
    <TouchableOpacity style={styles.periodSelector} onPress={onPress} activeOpacity={0.82} accessibilityRole="button" accessibilityLabel={`${label}: ${monthLabel(value)}`}>
      <View style={styles.periodSelectorIcon}>
        <MaterialCommunityIcons name="calendar-month-outline" size={19} color={COLORS.dadoUm} />
      </View>
      <View style={styles.periodSelectorCopy}>
        <Text style={styles.periodSelectorLabel}>{label}</Text>
        <Text style={styles.periodSelectorValue}>{monthLabel(value)}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-down" size={19} color={COLORS.dadoUm} />
    </TouchableOpacity>
  );
}

function MonthPickerModal({ visible, value, maxMonth, minMonth, title, onChange, onClose }) {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    if (!visible) return;
    const boundedValue = minMonth && compareMonths(value, minMonth) < 0 ? minMonth : value;
    setDraftValue(boundedValue);
  }, [minMonth, value, visible]);

  const { year: selectedYear, month: selectedMonthNumber } = parseMonth(draftValue);
  const { year: maxYear } = parseMonth(maxMonth);
  const firstYear = minMonth
    ? parseMonth(minMonth).year
    : Math.min(selectedYear, maxYear - 7);
  const years = Array.from({ length: maxYear - firstYear + 1 }, (_, index) => maxYear - index);
  const months = Array.from({ length: 12 }, (_, index) => index + 1);

  const chooseMonth = (monthNumber) => {
    const candidate = `${selectedYear}-${String(monthNumber).padStart(2, '0')}`;
    const isBeforeAccount = minMonth && compareMonths(candidate, minMonth) < 0;
    if (compareMonths(candidate, maxMonth) <= 0 && !isBeforeAccount) setDraftValue(candidate);
  };

  const applySelection = () => {
    onChange(draftValue);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={styles.monthModal}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalEyebrow}>Período</Text>
              <Text style={styles.modalTitle}>{title}</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose} accessibilityLabel="Fechar seletor de período">
              <MaterialCommunityIcons name="close" size={21} color={COLORS.dadoUm} />
            </TouchableOpacity>
          </View>

          <Text style={styles.pickerLabel}>Ano</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearScroll}>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.yearChip, selectedYear === year && styles.yearChipActive]}
                onPress={() => setDraftValue(`${year}-${String(selectedMonthNumber).padStart(2, '0')}`)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedYear === year }}>
                <Text style={[styles.yearChipText, selectedYear === year && styles.yearChipTextActive]}>{year}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.pickerLabel}>Mês</Text>
          <View style={styles.monthGrid}>
            {months.map((monthNumber) => {
              const candidate = `${selectedYear}-${String(monthNumber).padStart(2, '0')}`;
              const disabled = compareMonths(candidate, maxMonth) > 0
                || (minMonth && compareMonths(candidate, minMonth) < 0);
              const selected = selectedMonthNumber === monthNumber;
              return (
                <TouchableOpacity
                  key={candidate}
                  style={[styles.monthChip, selected && styles.monthChipActive, disabled && styles.monthChipDisabled]}
                  onPress={() => chooseMonth(monthNumber)}
                  disabled={disabled}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled }}>
                  <Text style={[styles.monthChipText, selected && styles.monthChipTextActive, disabled && styles.monthChipTextDisabled]}>
                    {monthName(monthNumber)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.selectedMonthBlock}>
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color={COLORS.dadoDois} />
            <Text style={styles.selectedMonthText}>{monthLabel(draftValue)}</Text>
            <Text style={styles.selectedMonthHint}>Meses futuros ficam indisponíveis</Text>
          </View>

          <TouchableOpacity style={styles.modalDoneButton} onPress={applySelection} activeOpacity={0.85}>
            <Text style={styles.modalDoneText}>Concluir</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

function LoadingState({ label = 'Carregando seus dados...' }) {
  return (
    <View style={styles.stateCard}>
      <ActivityIndicator size="large" color={COLORS.dadoDois} />
      <Text style={styles.stateTitle}>{label}</Text>
      <Text style={styles.stateDescription}>Estamos atualizando os indicadores do período.</Text>
    </View>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIcon}>
        <MaterialCommunityIcons name="cloud-alert-outline" size={28} color={COLORS.dashboardGastosGeraisAviso} />
      </View>
      <Text style={styles.stateTitle}>Não foi possível carregar</Text>
      <Text style={styles.stateDescription}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.85}>
        <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
        <Text style={styles.retryText}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyComparison({ message = 'Ainda não há dados para comparar.' }) {
  return (
    <View style={styles.emptyComparison}>
      <MaterialCommunityIcons name="chart-box-outline" size={28} color={COLORS.dadoTres} />
      <Text style={styles.emptyComparisonTitle}>Sem dados suficientes</Text>
      <Text style={styles.emptyComparisonText}>{message}</Text>
    </View>
  );
}

function EvolutionChart({ periods }) {
  const max = Math.max(...periods.map((period) => Number(period.total_centavos || 0)), 1);
  const { width } = useWindowDimensions();
  const [activePoint, setActivePoint] = useState(null);
  const [chartType, setChartType] = useState('line');
  const chartWidth = Math.max(width - 62, 280);
  const chartHeight = 236;
  const plotLeft = 48;
  const plotTop = 20;
  const plotRight = chartWidth - 10;
  const plotBottom = 184;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const points = periods.map((period, index) => {
    const total = Number(period.total_centavos || 0);
    const x = periods.length === 1
      ? plotLeft + plotWidth / 2
      : plotLeft + (index * plotWidth) / (periods.length - 1);
    const y = plotBottom - (total / max) * plotHeight;
    return { period, total, x, y };
  });
  const linePath = buildSmoothPath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${plotBottom} L ${points[0].x} ${plotBottom} Z`
    : '';

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Evolução dos gastos</Text>
          <Text style={styles.chartSubtitle}>{chartType === 'line' ? 'Tendência mensal' : 'Total por mês'}</Text>
        </View>
        <TouchableOpacity
          style={styles.chartToggle}
          onPress={() => setChartType((current) => (current === 'line' ? 'bar' : 'line'))}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={chartType === 'line' ? 'Alternar para gráfico de barras' : 'Alternar para gráfico de linha'}>
          <MaterialCommunityIcons name={chartType === 'line' ? 'chart-bar' : 'chart-timeline-variant'} size={21} color={COLORS.dadoUm} />
        </TouchableOpacity>
      </View>
      {activePoint ? (
        <View style={styles.pointTooltip}>
          <Text style={styles.pointTooltipLabel}>{monthLabel(activePoint.period.periodo)}</Text>
          <Text style={styles.pointTooltipValue}>{formatCents(activePoint.total)}</Text>
        </View>
      ) : null}
      <View style={styles.evolutionChart}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="dashboardEvolutionArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={COLORS.dadoDois} stopOpacity="0.26" />
              <Stop offset="1" stopColor={COLORS.dadoDois} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>
          {[0, 1, 2, 3].map((step) => {
            const y = plotTop + (plotHeight * step) / 3;
            const value = max - (max * step) / 3;
            return (
              <React.Fragment key={`grid-${step}`}>
                <Line x1={plotLeft} x2={plotRight} y1={y} y2={y} stroke="#ECE8F4" strokeWidth="1" />
                <SvgText x={plotLeft - 7} y={y + 4} fill="#9295AC" fontSize="10" textAnchor="end">
                  {formatAxisCents(value)}
                </SvgText>
              </React.Fragment>
            );
          })}
          {chartType === 'line' && areaPath ? <Path d={areaPath} fill="url(#dashboardEvolutionArea)" /> : null}
          {chartType === 'line' && linePath ? <Path d={linePath} fill="none" stroke={COLORS.dadoDois} strokeWidth="3" strokeLinecap="round" /> : null}
          {chartType === 'bar' ? points.map((point) => {
            const barWidth = Math.max(10, Math.min(30, plotWidth / Math.max(points.length * 1.7, 1)));
            const barHeight = Math.max(point.total > 0 ? plotBottom - point.y : 3, 3);
            return (
              <Rect
                key={`bar-${point.period.periodo}`}
                x={point.x - barWidth / 2}
                y={plotBottom - barHeight}
                width={barWidth}
                height={barHeight}
                rx={barWidth / 2}
                fill={point.total > 0 ? COLORS.dadoDois : '#DCDDEA'}
                opacity={activePoint?.period.periodo === point.period.periodo ? 1 : 0.82}
              />
            );
          }) : null}
          {chartType === 'line' ? points.map((point) => (
            <Circle
              key={`point-${point.period.periodo}`}
              cx={point.x}
              cy={point.y}
              r={activePoint?.period.periodo === point.period.periodo ? 6 : 4}
              fill="#FFFFFF"
              stroke={COLORS.dadoDois}
              strokeWidth="3"
            />
          )) : null}
        </Svg>
        <View style={styles.evolutionTouchLayer}>
          {points.map((point) => (
            <TouchableOpacity
              key={`touch-${point.period.periodo}`}
              style={[styles.evolutionTouchPoint, { left: point.x - 16, top: point.y - 16 }]}
              onPress={() => setActivePoint(point)}
              accessibilityRole="button"
              accessibilityLabel={`${monthLabel(point.period.periodo)}: ${formatCents(point.total)}`} />
          ))}
        </View>
        <View style={[styles.evolutionLabels, { left: plotLeft, width: plotWidth }]}>
          {periods.map((period) => (
            <Text key={period.periodo} style={[styles.evolutionLabel, periods.length > 6 && styles.evolutionLabelCompact]}>
              {periods.length > 6 ? monthShortLabel(period.periodo).split('/')[0] : monthShortLabel(period.periodo)}
            </Text>
          ))}
        </View>
      </View>
      <Text style={styles.chartFootnote}>Meses sem compras aparecem como zero.</Text>
    </View>
  );
}

function ComparisonSummary({ comparison }) {
  const total = comparison?.total;
  const quantity = comparison?.quantidade_compras;
  if (!total || !quantity) return null;
  const difference = Number(total.diferenca || 0);
  const differenceTone = difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'neutral';
  const differenceLabel = difference > 0 ? 'Aumento' : difference < 0 ? 'Redução' : 'Sem alteração';

  return (
    <View style={styles.comparisonSummary}>
      <View style={styles.comparisonSummaryHeader}>
        <Text style={styles.chartTitle}>Resumo da comparação</Text>
        <Text style={styles.comparisonPeriods}>{monthLabel(comparison.periodo_base)} × {monthLabel(comparison.periodo_comparado)}</Text>
      </View>
      <View style={styles.comparisonMetricRow}>
        <View style={styles.comparisonMetric}>
          <Text style={styles.comparisonMetricLabel}>Período A</Text>
          <Text style={styles.comparisonMetricValue}>{formatCents(total.base)}</Text>
        </View>
        <View style={styles.comparisonMetricDivider} />
        <View style={styles.comparisonMetric}>
          <Text style={styles.comparisonMetricLabel}>Período B</Text>
          <Text style={styles.comparisonMetricValue}>{formatCents(total.comparado)}</Text>
        </View>
      </View>
      <View style={styles.comparisonVisualBlock}>
        <View style={styles.comparisonVisualHeader}>
          <Text style={styles.comparisonMetricLabel}>Distribuição do gasto total</Text>
          <Text style={styles.comparisonVisualHint}>A × B</Text>
        </View>
        <View style={styles.comparisonVisualRow}>
          <Text style={styles.comparisonVisualLabel}>A</Text>
          <View style={styles.comparisonVisualTrack}>
            <View style={[styles.comparisonVisualFillA, { width: `${Math.max((Number(total.base || 0) / Math.max(Number(total.base || 0), Number(total.comparado || 0), 1)) * 100, 2)}%` }]} />
          </View>
        </View>
        <View style={styles.comparisonVisualRow}>
          <Text style={styles.comparisonVisualLabel}>B</Text>
          <View style={styles.comparisonVisualTrack}>
            <View style={[styles.comparisonVisualFillB, { width: `${Math.max((Number(total.comparado || 0) / Math.max(Number(total.base || 0), Number(total.comparado || 0), 1)) * 100, 2)}%` }]} />
          </View>
        </View>
      </View>
      <View style={styles.comparisonDifferenceRow}>
        <View>
          <Text style={styles.comparisonMetricLabel}>Diferença</Text>
          <Text style={[styles.comparisonDifference, styles[`comparisonDifference${differenceTone[0].toUpperCase()}${differenceTone.slice(1)}`]]}>
            {differenceLabel} · {formatSignedCents(total.diferenca)}
          </Text>
        </View>
        <View style={[styles.percentPill, styles[`percentPill${differenceTone[0].toUpperCase()}${differenceTone.slice(1)}`]]}>
          <Text style={styles.percentPillText}>{formatPercent(total.variacao_percentual)}</Text>
        </View>
      </View>
      <View style={styles.purchaseCountRow}>
        <MaterialCommunityIcons name="cart-outline" size={18} color={COLORS.dadoUm} />
        <Text style={styles.purchaseCountText}>
          {quantity.base} compras no período A · {quantity.comparado} no período B
        </Text>
      </View>
    </View>
  );
}

function PaymentComparisonChart({ periods }) {
  const [expanded, setExpanded] = useState(false);
  const rowsByLabel = new Map();

  (periods || []).slice(0, 2).forEach((period, periodIndex) => {
    (period.formas_pagamento || []).forEach((item) => {
      const label = item.forma_pagamento_nome || 'Não informado';
      const current = rowsByLabel.get(label) || { label, base: 0, compared: 0 };
      current[periodIndex === 0 ? 'base' : 'compared'] = Number(item.total_centavos || 0);
      rowsByLabel.set(label, current);
    });
  });

  const rows = [...rowsByLabel.values()].sort((left, right) => (
    right.base + right.compared - left.base - left.compared
  ));
  if (!rows.length) return <EmptyComparison message="Nenhuma forma de pagamento apareceu nos períodos escolhidos." />;

  const visibleRows = expanded ? rows : rows.slice(0, 4);
  const max = Math.max(...rows.flatMap((row) => [row.base, row.compared]), 1);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Formas de pagamento</Text>
          <Text style={styles.chartSubtitle}>Distribuição comparada</Text>
        </View>
        <View style={styles.legendInline}>
          <View style={styles.legendInlineItem}><View style={[styles.legendDot, { backgroundColor: COLORS.dadoTres }]} /><Text style={styles.legendInlineText}>A</Text></View>
          <View style={styles.legendInlineItem}><View style={[styles.legendDot, { backgroundColor: COLORS.dadoDois }]} /><Text style={styles.legendInlineText}>B</Text></View>
        </View>
      </View>
      {visibleRows.map((row) => {
        const difference = row.compared - row.base;
        const variation = row.base === 0 ? null : (difference / row.base) * 100;
        return (
          <View key={row.label} style={styles.categoryComparisonRow}>
            <View style={styles.categoryComparisonHeader}>
              <Text style={styles.categoryComparisonName} numberOfLines={1}>{row.label}</Text>
              <Text style={styles.categoryComparisonVariation} numberOfLines={2}>
                {formatSignedCents(difference)} · {formatPercent(variation)}
              </Text>
            </View>
            <View style={styles.categoryBarRow}>
              <Text style={styles.categoryBarLabel}>A</Text>
              <View style={styles.categoryBarTrack}><View style={[styles.categoryBarFill, { width: `${(row.base / max) * 100}%`, backgroundColor: COLORS.dadoTres }]} /></View>
              <Text style={styles.categoryBarValue}>{formatCents(row.base)}</Text>
            </View>
            <View style={styles.categoryBarRow}>
              <Text style={styles.categoryBarLabel}>B</Text>
              <View style={styles.categoryBarTrack}><View style={[styles.categoryBarFill, { width: `${(row.compared / max) * 100}%`, backgroundColor: COLORS.dadoDois }]} /></View>
              <Text style={styles.categoryBarValue}>{formatCents(row.compared)}</Text>
            </View>
          </View>
        );
      })}
      {rows.length > 4 ? (
        <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded((current) => !current)} activeOpacity={0.8}>
          <Text style={styles.expandButtonText}>{expanded ? 'Mostrar principais' : `Ver todas (${rows.length})`}</Text>
          <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.dadoDois} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function CategoryComparisonChart({ categories }) {
  const [expanded, setExpanded] = useState(false);
  if (!categories?.length) {
    return <EmptyComparison message="Nenhuma categoria apareceu nos períodos escolhidos." />;
  }

  const orderedCategories = [...categories].sort((left, right) => {
    const leftTotal = Number(left.base_total_centavos || 0) + Number(left.comparado_total_centavos || 0);
    const rightTotal = Number(right.base_total_centavos || 0) + Number(right.comparado_total_centavos || 0);
    return rightTotal - leftTotal;
  });
  const visibleCategories = expanded ? orderedCategories : orderedCategories.slice(0, 5);
  const max = Math.max(...visibleCategories.flatMap((category) => [category.base_total_centavos, category.comparado_total_centavos]), 1);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Categorias</Text>
          <Text style={styles.chartSubtitle}>Comparação por gasto bruto</Text>
        </View>
        <View style={styles.legendInline}>
          <View style={styles.legendInlineItem}><View style={[styles.legendDot, { backgroundColor: COLORS.dadoTres }]} /><Text style={styles.legendInlineText}>A</Text></View>
          <View style={styles.legendInlineItem}><View style={[styles.legendDot, { backgroundColor: COLORS.dadoDois }]} /><Text style={styles.legendInlineText}>B</Text></View>
        </View>
      </View>
      {visibleCategories.map((category) => (
        <View key={category.categoria_id} style={styles.categoryComparisonRow}>
          <View style={styles.categoryComparisonHeader}>
            <Text style={styles.categoryComparisonName} numberOfLines={1}>{category.categoria_nome}</Text>
            <Text style={styles.categoryComparisonVariation} numberOfLines={2}>
              Δ {formatSignedCents(category.diferenca_centavos)} · {formatPercent(category.variacao_percentual)}
            </Text>
          </View>
          <View style={styles.categoryBarRow}>
            <Text style={styles.categoryBarLabel}>A</Text>
            <View style={styles.categoryBarTrack}>
              <View style={[styles.categoryBarFill, { width: `${(category.base_total_centavos / max) * 100}%`, backgroundColor: COLORS.dadoTres }]} />
            </View>
            <Text style={styles.categoryBarValue}>{formatCents(category.base_total_centavos)}</Text>
          </View>
          <View style={styles.categoryBarRow}>
            <Text style={styles.categoryBarLabel}>B</Text>
            <View style={styles.categoryBarTrack}>
              <View style={[styles.categoryBarFill, { width: `${(category.comparado_total_centavos / max) * 100}%`, backgroundColor: COLORS.dadoDois }]} />
            </View>
            <Text style={styles.categoryBarValue}>{formatCents(category.comparado_total_centavos)}</Text>
          </View>
        </View>
      ))}
      {orderedCategories.length > 5 ? (
        <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded((current) => !current)} activeOpacity={0.8}>
          <Text style={styles.expandButtonText}>
            {expanded ? 'Mostrar principais' : `Ver todas as categorias (${orderedCategories.length})`}
          </Text>
          <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.dadoDois} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ComparisonControls({
  mode,
  setMode,
  months,
  setMonths,
  evolutionEnd,
  compareMonthA,
  compareMonthB,
  onOpenPicker,
}) {
  return (
    <>
      <View style={styles.modeSwitch}>
        <TouchableOpacity style={[styles.modeButton, mode === 'evolution' && styles.modeButtonActive]} onPress={() => setMode('evolution')}>
          <Text style={[styles.modeButtonText, mode === 'evolution' && styles.modeButtonTextActive]}>Evolução</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeButton, mode === 'compare' && styles.modeButtonActive]} onPress={() => setMode('compare')}>
          <Text style={[styles.modeButtonText, mode === 'compare' && styles.modeButtonTextActive]}>Comparar meses</Text>
        </TouchableOpacity>
      </View>

      {mode === 'evolution' ? (
        <View style={styles.controlCard}>
          <View style={styles.controlHeader}>
            <View>
              <Text style={styles.controlTitle}>Janela de evolução</Text>
              <Text style={styles.controlSubtitle}>Escolha quantos meses visualizar</Text>
            </View>
            <TouchableOpacity style={styles.periodPickerButton} onPress={() => onOpenPicker('evolutionEnd')}>
              <MaterialCommunityIcons name="calendar-range" size={17} color={COLORS.dadoUm} />
              <Text style={styles.periodPickerText}>{monthLabel(evolutionEnd)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.segmentedControl}>
            {[6, 12].map((option) => (
              <TouchableOpacity key={option} style={[styles.segmentButton, months === option && styles.segmentButtonActive]} onPress={() => setMonths(option)}>
                <Text style={[styles.segmentButtonText, months === option && styles.segmentButtonTextActive]}>{option} meses</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.controlFootnote}>Período final: {monthLabel(evolutionEnd)}</Text>
        </View>
      ) : (
        <View style={styles.controlCard}>
          <Text style={styles.controlTitle}>Escolha os períodos</Text>
          <Text style={styles.controlSubtitle}>Meses diferentes e até anos diferentes</Text>
          <View style={styles.comparePickerRow}>
            <TouchableOpacity style={styles.comparePickerButton} onPress={() => onOpenPicker('monthA')}>
              <Text style={styles.comparePickerLabel}>Período A</Text>
              <Text style={styles.comparePickerValue}>{monthLabel(compareMonthA)}</Text>
            </TouchableOpacity>
            <MaterialCommunityIcons name="compare-arrows" size={23} color={COLORS.dadoDois} />
            <TouchableOpacity style={styles.comparePickerButton} onPress={() => onOpenPicker('monthB')}>
              <Text style={styles.comparePickerLabel}>Período B</Text>
              <Text style={styles.comparePickerValue}>{monthLabel(compareMonthB)}</Text>
            </TouchableOpacity>
          </View>
          {compareMonthA === compareMonthB ? <Text style={styles.validationText}>Escolha dois meses diferentes para comparar.</Text> : null}
        </View>
      )}
    </>
  );
}

export default function DashboardScreen({ navigation }) {
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const isFocused = useIsFocused();
  const { fetchTempoUso, fetchUsuario } = useDataRefresh();
  const pagerRef = useRef(null);
  const overviewAbortRef = useRef(null);
  const contextAbortRef = useRef(null);
  const comparisonAbortRef = useRef(null);
  const overviewRequestRef = useRef(0);
  const contextRequestRef = useRef(0);
  const comparisonRequestRef = useRef(0);

  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [overviewData, setOverviewData] = useState(null);
  const [tempoUso, setTempoUso] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);
  const [comparisonMode, setComparisonMode] = useState('evolution');
  const [evolutionMonths, setEvolutionMonths] = useState(6);
  const [evolutionEnd, setEvolutionEnd] = useState(currentMonth);
  const [compareMonthA, setCompareMonthA] = useState(shiftMonth(currentMonth, -1));
  const [compareMonthB, setCompareMonthB] = useState(currentMonth);
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(true);
  const [comparisonError, setComparisonError] = useState(null);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const maxMonth = currentMonth;

  const openPicker = useCallback((target) => setPickerTarget(target), []);
  const closePicker = useCallback(() => setPickerTarget(null), []);

  const pickerValue = pickerTarget === 'evolutionEnd'
    ? evolutionEnd
    : pickerTarget === 'monthA'
      ? compareMonthA
      : pickerTarget === 'monthB'
        ? compareMonthB
        : selectedMonth;

  const handlePickerChange = useCallback((value) => {
    if (pickerTarget === 'evolutionEnd') setEvolutionEnd(value);
    else if (pickerTarget === 'monthA') setCompareMonthA(value);
    else if (pickerTarget === 'monthB') setCompareMonthB(value);
    else setSelectedMonth(value);
  }, [pickerTarget]);

  const handleOverviewMonthChange = useCallback((value) => {
    setSelectedMonth(value);
    setOverviewData(null);
    setOverviewError(null);
  }, []);

  const loadContext = useCallback(async () => {
    const requestId = contextRequestRef.current + 1;
    contextRequestRef.current = requestId;
    contextAbortRef.current?.abort();
    const controller = new AbortController();
    contextAbortRef.current = controller;

    try {
      const [tempoData, usuarioData] = await Promise.all([fetchTempoUso(), fetchUsuario()]);
      if (requestId !== contextRequestRef.current || controller.signal.aborted) return;
      setTempoUso(Array.isArray(tempoData) ? tempoData : []);
      setUsuario(usuarioData);
    } catch (error) {
      if (!isCanceled(error) && requestId === contextRequestRef.current) {
        logApiErrors(error, 'Erro ao atualizar o contexto da dashboard');
      }
    }
  }, [fetchTempoUso, fetchUsuario]);

  const loadOverview = useCallback(async () => {
    const requestId = overviewRequestRef.current + 1;
    overviewRequestRef.current = requestId;
    overviewAbortRef.current?.abort();
    const controller = new AbortController();
    overviewAbortRef.current = controller;
    setOverviewLoading(true);
    setOverviewError(null);
    setOverviewData(null);

    try {
      const data = await getDashboardAnalytics({ mode: 'month', month: selectedMonth }, { signal: controller.signal });
      if (requestId !== overviewRequestRef.current || controller.signal.aborted) return;
      setOverviewData(data);
    } catch (error) {
      if (requestId !== overviewRequestRef.current || isCanceled(error)) return;
      logApiErrors(error, 'Erro ao buscar analytics do período');
      setOverviewError('Confira sua conexão e tente carregar o período novamente.');
    } finally {
      if (requestId === overviewRequestRef.current) setOverviewLoading(false);
    }
  }, [selectedMonth]);

  const loadComparison = useCallback(async () => {
    if (comparisonMode === 'compare' && compareMonthA === compareMonthB) {
      setComparisonData(null);
      setComparisonError('Escolha dois meses diferentes para comparar.');
      setComparisonLoading(false);
      return;
    }

    const requestId = comparisonRequestRef.current + 1;
    comparisonRequestRef.current = requestId;
    comparisonAbortRef.current?.abort();
    const controller = new AbortController();
    comparisonAbortRef.current = controller;
    setComparisonLoading(true);
    setComparisonError(null);
    setComparisonData(null);

    const params = comparisonMode === 'evolution'
      ? { mode: 'evolution', months: evolutionMonths, end: evolutionEnd }
      : { mode: 'compare', monthA: compareMonthA, monthB: compareMonthB };

    try {
      const data = await getDashboardAnalytics(params, { signal: controller.signal });
      if (requestId !== comparisonRequestRef.current || controller.signal.aborted) return;
      setComparisonData(data);
    } catch (error) {
      if (requestId !== comparisonRequestRef.current || isCanceled(error)) return;
      logApiErrors(error, 'Erro ao buscar comparativos da dashboard');
      setComparisonError('Não foi possível carregar este comparativo.');
    } finally {
      if (requestId === comparisonRequestRef.current) setComparisonLoading(false);
    }
  }, [comparisonMode, compareMonthA, compareMonthB, evolutionEnd, evolutionMonths]);

  useFocusEffect(
    useCallback(() => {
      loadOverview();
      loadContext();
    }, [loadContext, loadOverview]),
  );

  useEffect(() => {
    if (isFocused && activeTab === 1) loadComparison();
  }, [activeTab, isFocused, loadComparison]);

  useEffect(() => () => {
    overviewAbortRef.current?.abort();
    contextAbortRef.current?.abort();
    comparisonAbortRef.current?.abort();
  }, []);

  useEffect(() => {
    pagerRef.current?.scrollTo({ x: activeTab * width, animated: false });
  }, [activeTab, width]);

  const selectTab = useCallback((index) => {
    setActiveTab(index);
    pagerRef.current?.scrollTo({ x: index * width, animated: true });
  }, [width]);

  const handlePagerEnd = useCallback((event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1));
    if (index !== activeTab) setActiveTab(index);
  }, [activeTab, width]);

  const handleRefresh = useCallback(() => {
    if (activeTab === 0) {
      loadOverview();
      loadContext();
    } else {
      loadComparison();
    }
  }, [activeTab, loadComparison, loadContext, loadOverview]);

  const period = overviewData?.periodos?.[0] || null;
  const metaValue = Number(usuario?.usuario_meta_valor_mensal || 0);
  const metaCents = Math.round(metaValue * 100);
  const totalCents = Number(period?.total_centavos || 0);
  const metaUsagePercent = metaCents > 0 ? (totalCents / metaCents) * 100 : 0;
  const metaProgress = Math.min(metaUsagePercent, 100);
  const metaStatus = metaCents <= 0
    ? 'undefined'
    : metaUsagePercent > 100
      ? 'exceeded'
      : metaUsagePercent >= 80
        ? 'near'
        : 'within';
  const metaExcessCents = metaCents > 0 ? Math.max(totalCents - metaCents, 0) : 0;
  const metaStatusCopy = {
    undefined: 'Meta ainda não definida',
    exceeded: 'Meta excedida',
    near: 'Próximo da meta',
    within: 'Dentro da meta',
  }[metaStatus];
  const metaStatusIcon = {
    undefined: 'information-outline',
    exceeded: 'alert-circle-outline',
    near: 'progress-clock',
    within: 'check-circle-outline',
  }[metaStatus];
  const metaStatusColor = {
    undefined: COLORS.dadoUm,
    exceeded: COLORS.dashboardGastosGeraisAviso,
    near: DASHBOARD_COLORS.caution,
    within: DASHBOARD_COLORS.positive,
  }[metaStatus];
  const limitData = period?.compras_acima_limite || { acima_limite: 0, dentro_limite: 0 };
  const isHistoricalMonth = selectedMonth !== currentMonth;
  const accountStartMonth = getMonthInTimezone(usuario?.usuario_data_criacao);

  const renderOverview = () => {
    if (overviewLoading && !overviewData) return <LoadingState />;
    if (overviewError && !overviewData) return <ErrorState message={overviewError} onRetry={loadOverview} />;

    return (
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={[styles.pageContent, { paddingBottom: tabBarHeight + 28 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={overviewLoading} onRefresh={handleRefresh} tintColor={COLORS.dadoDois} />}>
        <View style={styles.pageIntro}>
          <Text style={styles.pageEyebrow}>VISÃO GERAL</Text>
          <Text style={styles.pageTitle}>Visão financeira</Text>
          <Text style={styles.pageSubtitle}>Seu panorama financeiro, com dados do período selecionado.</Text>
        </View>

        <PeriodSelector value={selectedMonth} onPress={() => setMonthPickerOpen(true)} label="Mês analisado" />

        <View style={[styles.heroCard, styles[`heroCard${metaStatus[0].toUpperCase()}${metaStatus.slice(1)}`]]}>
          <View style={styles.heroTopLine}>
            <View>
              <Text style={styles.heroEyebrow}>Gasto total</Text>
              <Text style={styles.heroPeriod}>{period?.periodo ? monthLabel(period.periodo) : 'Período selecionado'}</Text>
            </View>
            <View style={[styles.heroIcon, { backgroundColor: `${metaStatusColor}18` }]}>
              <MaterialCommunityIcons name="wallet-outline" size={23} color={metaStatusColor} />
            </View>
          </View>
          <Text style={styles.heroValue}>{formatCents(totalCents)}</Text>
          <View style={styles.heroFacts}>
            <View style={styles.heroFact}><Text style={styles.heroFactValue}>{period?.quantidade_compras || 0}</Text><Text style={styles.heroFactLabel}>compras</Text></View>
            <View style={styles.heroFactDivider} />
            <View style={styles.heroFact}><Text style={styles.heroFactValue}>{formatCents(period?.desconto_centavos || 0)}</Text><Text style={styles.heroFactLabel}>descontos</Text></View>
          </View>
          <View style={styles.budgetBlock}>
            <View style={styles.budgetHeader}>
              <View style={styles.budgetHeaderCopy}>
                <Text style={styles.budgetLabel}>Limite mensal{isHistoricalMonth ? ' · configuração atual' : ''}</Text>
                <Text style={styles.budgetTarget}>{metaCents > 0 ? formatReais(metaValue) : 'Cadastre um limite'}</Text>
              </View>
            </View>
            <View style={styles.budgetTrack}><View style={[styles.budgetFill, { width: `${metaProgress}%`, backgroundColor: metaStatusColor }]} /></View>
            <View style={styles.budgetStatusRow}>
              <MaterialCommunityIcons name={metaStatusIcon} size={16} color={metaStatusColor} />
              <Text style={[styles.budgetStatusText, { color: metaStatusColor }]}>{metaStatusCopy}</Text>
              {metaExcessCents > 0 ? <Text style={styles.budgetExcess}>{formatCents(metaExcessCents)} acima da meta</Text> : null}
            </View>
            <Text style={styles.budgetCaption}>
              {metaCents > 0
                ? `${Math.round((totalCents / metaCents) * 100)}% do limite utilizado${isHistoricalMonth ? ' · configuração atual' : ''}`
                : 'Cadastre um limite para acompanhar sua evolução.'}
            </Text>
          </View>
        </View>

        {!period || period.quantidade_compras === 0 ? (
          <View style={styles.emptyPeriodBanner}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={20} color={COLORS.dadoTres} />
            <View style={styles.emptyPeriodCopy}>
              <Text style={styles.emptyPeriodTitle}>Nenhuma compra neste mês</Text>
              <Text style={styles.emptyPeriodText}>Os indicadores financeiros estão zerados para este período.</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.metricGrid}>
          <MetricTile icon="cart-check" label="Compras" value={String(period?.quantidade_compras || 0)} caption="confirmadas" color={COLORS.dadoUm} />
          <MetricTile icon="sale" label="Descontos" value={formatCents(period?.desconto_centavos || 0)} caption="no período" color={COLORS.dadoDois} />
          <MetricTile icon="alert-circle-outline" label="Acima do limite" value={String(limitData.acima_limite || 0)} caption={`${limitData.dentro_limite || 0} dentro`} color={COLORS.dashboardGastosGeraisAviso} />
          <MetricTile icon="database-outline" label="Com valor" value={String(period?.quantidade_compras_com_valor || 0)} caption="valores conhecidos" color={COLORS.dadoTres} />
        </View>

        <Categoria gastosCategoria={period?.categorias || []} />
        <FormaPagamento gastosFormaPagamento={period?.formas_pagamento || []} />
        <Impulsividade data={period?.impulsividade || []} />
        <Impulsividade
          data={limitData}
          title="Compras acima do limite"
          emptyMessage="Nenhuma compra disponível para análise"
          centerLabel="acima do limite"
          centerValueMode="quantity"
          infoTitle="Limite de compras"
          highLabel="Acima do limite"
          mediumLabel="Próximo do limite"
          lowLabel="Dentro do limite"
          highDescription="Existem compras acima do valor limite definido para o período."
          mediumDescription="O volume de compras está se aproximando do limite definido."
          lowDescription="As compras estão dentro do limite definido para o período."
          totalKey="acima_limite"
        />
        <TempoApp tempoUso={tempoUso} title="Tempo de uso · Hoje" />
      </ScrollView>
    );
  };

  const renderComparison = () => (
    <ScrollView
      style={styles.pageScroll}
      contentContainerStyle={[styles.pageContent, { paddingBottom: tabBarHeight + 28 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={comparisonLoading} onRefresh={handleRefresh} tintColor={COLORS.dadoDois} />}>
      <View style={styles.pageIntro}>
        <Text style={styles.pageEyebrow}>ANÁLISES</Text>
        <Text style={styles.pageTitle}>Comparativos</Text>
        <Text style={styles.pageSubtitle}>Encontre mudanças no seu comportamento de consumo.</Text>
      </View>

      <ComparisonControls
        mode={comparisonMode}
        setMode={setComparisonMode}
        months={evolutionMonths}
        setMonths={setEvolutionMonths}
        evolutionEnd={evolutionEnd}
        compareMonthA={compareMonthA}
        compareMonthB={compareMonthB}
        onOpenPicker={openPicker}
      />

      {comparisonLoading && !comparisonData ? <LoadingState label="Montando seu comparativo..." /> : null}
      {comparisonError && !comparisonLoading ? <ErrorState message={comparisonError} onRetry={loadComparison} /> : null}
      {!comparisonLoading && !comparisonError && comparisonData && comparisonMode === 'evolution' ? <EvolutionChart periods={comparisonData.periodos || []} /> : null}
      {!comparisonLoading && !comparisonError && comparisonData && comparisonMode === 'compare' ? (
        <>
          <ComparisonSummary comparison={comparisonData.comparacao} />
          <CategoryComparisonChart categories={comparisonData.comparacao?.categorias || []} />
          <PaymentComparisonChart periods={comparisonData.periodos || []} />
        </>
      ) : null}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>plenna</Text>
          <Text style={styles.headerSubtitle}>Consumo com mais consciência</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.navigate('Purchases')} accessibilityLabel="Abrir compras">
            <MaterialCommunityIcons name="shopping-outline" size={21} color={COLORS.dadoUm} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        {['Visão geral', 'Comparativos'].map((label, index) => (
          <TouchableOpacity key={label} style={styles.tabButton} onPress={() => selectTab(index)} activeOpacity={0.8} accessibilityRole="tab" accessibilityState={{ selected: activeTab === index }}>
            <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>{label}</Text>
            {activeTab === index ? <View style={styles.tabIndicator} /> : null}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePagerEnd}
        scrollEventThrottle={16}
        style={styles.pager}>
        <View style={{ width }}>{renderOverview()}</View>
        <View style={{ width }}>{renderComparison()}</View>
      </ScrollView>

      <MonthPickerModal
        visible={monthPickerOpen}
        value={selectedMonth}
        maxMonth={maxMonth}
        minMonth={accountStartMonth}
        title="Mês da visão geral"
        onChange={handleOverviewMonthChange}
        onClose={() => setMonthPickerOpen(false)}
      />

      <MonthPickerModal
        visible={Boolean(pickerTarget)}
        value={pickerValue}
        maxMonth={maxMonth}
        minMonth={accountStartMonth}
        title={pickerTarget === 'evolutionEnd' ? 'Fim da evolução' : pickerTarget === 'monthA' ? 'Período A' : 'Período B'}
        onChange={handlePickerChange}
        onClose={closePicker}
      />
    </SafeAreaView>
  );
}
