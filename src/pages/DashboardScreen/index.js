import { segundosHistoricoUso, filtrarHistoricoUso } from '../../utils/historicoTempoUso';
import { mensagemErroAnalytics, diagnosticoAnalytics } from '../../utils/erroAnalytics';
import { useResumoHome } from '../../hooks/useResumoHome';
import UsageTimePanel from '../../components/UsageTimePanel';
import { usageMonitoringReadsEnabled } from '../../api/usageMonitoringPolicy';
import { useDescobertasResumo } from '../../hooks/useDescobertasResumo';
import DescobertasDashboard from '../../components/DashboardComponents/DescobertasDashboard';
import MovimentacoesCompra from '../../components/DashboardComponents/MovimentacoesCompra';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Categoria from '../../components/DashboardComponents/Categoria';
import FormaPagamento from '../../components/DashboardComponents/FormaPagamento';
import Impulsividade from '../../components/DashboardComponents/Impulsividade';
import TempoApp from '../../components/DashboardComponents/TempoApp';
import AnaliseComportamento from '../../components/DashboardComponents/AnaliseComportamento';
import { ResumoMensalCarousel } from '../../components/DashboardComponents/GastosGerais';
import { COLORS } from '../../constants/colors';
import { getDashboardAnalytics } from '../../api/dashboard';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { useAnaliseComportamento } from '../../hooks/useAnaliseComportamento';
import { logApiErrors } from '../../utils/error';
import CustomButton from '../../components/CustomButton';
import AppEmptyState from '../../components/Common/AppEmptyState';
import { observarAtualizacaoTempoUso } from '../../utils/tempoUsoAtualizacao';
import { apresentarMeiaLua, corPorProporcao } from '../../utils/meiaLuaHome';
import { styles } from './styles';

const ANALYTICS_TIMEZONE = 'America/Sao_Paulo';
const COMPARISON_COLORS = {
  base: COLORS.dadoTres,
  compared: COLORS.dadoDois,
};

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

function isValidMonth(month) {
  return /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(String(month || ''));
}

function shiftMonth(month, amount) {
  const parsed = parseMonth(month);
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function compareMonths(left, right) {
  return parseMonth(left).year * 12 + parseMonth(left).month - (parseMonth(right).year * 12 + parseMonth(right).month);
}

function monthLabel(month) {
  const { year, month: monthNumber } = parseMonth(month);
  const value = new Date(Date.UTC(year, monthNumber - 1, 15, 12));
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: ANALYTICS_TIMEZONE,
    month: 'long',
    year: 'numeric',
  })
    .format(value)
    .replace(/^./, (letter) => letter.toUpperCase());
}

function monthShortLabel(month) {
  const { year, month: monthNumber } = parseMonth(month);
  const value = new Date(Date.UTC(year, monthNumber - 1, 15, 12));
  const shortMonth = new Intl.DateTimeFormat('pt-BR', {
    timeZone: ANALYTICS_TIMEZONE,
    month: 'short',
  })
    .format(value)
    .replace('.', '');
  return `${shortMonth.slice(0, 3)}/${String(year).slice(-2)}`;
}

function ComparisonPeriodTag({ month, color, compact = false }) {
  if (!month) return null;

  return (
    <View style={styles.comparisonPeriodTag}>
      <View style={[styles.comparisonPeriodDot, { backgroundColor: color }]} />
      <Text style={[styles.comparisonPeriodTagText, compact && styles.comparisonPeriodTagTextCompact]} numberOfLines={1}>
        {compact ? monthShortLabel(month) : monthLabel(month)}
      </Text>
    </View>
  );
}

function monthName(monthNumber) {
  const value = new Date(Date.UTC(2020, monthNumber - 1, 15, 12));
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: ANALYTICS_TIMEZONE,
    month: 'long',
  })
    .format(value)
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatCents(cents) {
  return `R$ ${(Number(cents || 0) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDailyDuration(totalMinutes) {
  const minutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
  if (minutes <= 0) return '--';

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
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

function PeriodSelector({ value, onPress, onPurchasesPress, label = 'Período' }) {
  return (
    <View style={styles.periodControls}>
      <TouchableOpacity style={styles.periodSelector} onPress={onPress} activeOpacity={0.82} accessibilityRole="button" accessibilityLabel={`${label}: ${monthLabel(value)}`}>
        <View style={styles.periodSelectorIcon}>
          <MaterialCommunityIcons name="calendar-month-outline" size={19} color={COLORS.dadoUm} />
        </View>
        <View style={styles.periodSelectorCopy}>
          <Text style={styles.periodSelectorLabel}>{label}</Text>
          <Text style={styles.periodSelectorValue} numberOfLines={1}>{monthLabel(value)}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={19} color={COLORS.dadoUm} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.purchasesButton}
        onPress={onPurchasesPress}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel="Abrir Minhas compras"
        accessibilityHint="Exibe suas compras protegidas por PIN ou biometria">
        <MaterialCommunityIcons name="cart-outline" size={21} color={COLORS.dadoUm} />
      </TouchableOpacity>
    </View>
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
  const firstYear = minMonth ? parseMonth(minMonth).year : Math.max(maxYear - 7, 2000);
  const years = Array.from({ length: maxYear - firstYear + 1 }, (_, index) => firstYear + index);
  const months = Array.from({ length: 12 }, (_, index) => index + 1);

  const boundedMonthForYear = (year, desiredMonth) => {
    let candidate = `${year}-${String(desiredMonth).padStart(2, '0')}`;
    if (compareMonths(candidate, maxMonth) > 0) candidate = maxMonth;
    if (minMonth && compareMonths(candidate, minMonth) < 0) candidate = minMonth;
    return candidate;
  };

  const chooseMonth = (monthNumber) => {
    const candidate = `${selectedYear}-${String(monthNumber).padStart(2, '0')}`;
    const isBeforeAccount = minMonth && compareMonths(candidate, minMonth) < 0;
    if (compareMonths(candidate, maxMonth) <= 0 && !isBeforeAccount) setDraftValue(candidate);
  };

  const changeYear = (amount) => {
    const currentIndex = years.indexOf(selectedYear);
    const nextIndex = Math.min(Math.max(currentIndex + amount, 0), years.length - 1);
    if (nextIndex !== currentIndex) {
      setDraftValue(boundedMonthForYear(years[nextIndex], selectedMonthNumber));
    }
  };

  const applySelection = () => {
    onChange(draftValue);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={styles.monthModal}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalEyebrow}>Período</Text>
              <Text style={styles.modalTitle}>{title}</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose} accessibilityLabel="Fechar seletor de período">
              <MaterialCommunityIcons name="close" size={21} color={COLORS.dadoUm} />
            </TouchableOpacity>
          </View>

          {years.length > 1 ? (
            <>
              <Text style={styles.pickerLabel}>Ano</Text>
              <View style={styles.yearControl}>
                <TouchableOpacity
                  style={[styles.yearControlButton, years.indexOf(selectedYear) === 0 && styles.yearControlButtonDisabled]}
                  onPress={() => changeYear(-1)}
                  disabled={years.indexOf(selectedYear) === 0}
                  accessibilityLabel="Ano anterior">
                  <MaterialCommunityIcons name="chevron-left" size={20} color={COLORS.dadoUm} />
                </TouchableOpacity>
                <Text style={styles.yearControlValue}>{selectedYear}</Text>
                <TouchableOpacity
                  style={[styles.yearControlButton, years.indexOf(selectedYear) === years.length - 1 && styles.yearControlButtonDisabled]}
                  onPress={() => changeYear(1)}
                  disabled={years.indexOf(selectedYear) === years.length - 1}
                  accessibilityLabel="Próximo ano">
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.dadoUm} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.singleYearRow}>
              <Text style={styles.pickerLabel}>Ano</Text>
              <Text style={styles.singleYearValue}>{selectedYear}</Text>
            </View>
          )}

          <Text style={styles.pickerLabel}>Mês</Text>
          <View style={styles.monthGrid}>
            {months.map((monthNumber) => {
              const candidate = `${selectedYear}-${String(monthNumber).padStart(2, '0')}`;
              const disabled = compareMonths(candidate, maxMonth) > 0 || (minMonth && compareMonths(candidate, minMonth) < 0);
              const selected = selectedMonthNumber === monthNumber;
              return (
                <TouchableOpacity
                  key={candidate}
                  style={[styles.monthChip, selected && styles.monthChipActive, disabled && styles.monthChipDisabled]}
                  onPress={() => chooseMonth(monthNumber)}
                  disabled={disabled}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled }}>
                  <Text style={[styles.monthChipText, selected && styles.monthChipTextActive, disabled && styles.monthChipTextDisabled]}>{monthName(monthNumber)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.selectedMonthBlock}>
            <Text style={styles.selectedMonthText}>{monthLabel(draftValue)}</Text>
            <Text style={styles.selectedMonthHint}>Meses futuros e anteriores à conta ficam bloqueados.</Text>
          </View>

          <CustomButton title="Concluir" variant="primary" onPress={applySelection} style={styles.modalDoneButton} />
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
      <CustomButton title="Tentar novamente" variant="outline" icon="refresh" onPress={onRetry} style={styles.retryButton} />
    </View>
  );
}

function EmptyComparison({ message = 'Ainda não há dados para comparar.' }) {
  return (
    <View style={styles.emptyComparison}>
      <AppEmptyState icon="chart-box-outline" title="Sem dados suficientes" description={message} compact />
    </View>
  );
}

function getVisibleEvolutionPeriods(periods, accountStartMonth, evolutionEnd, requestedMonths) {
  const lastMonth = evolutionEnd || periods[periods.length - 1]?.periodo;
  if (!lastMonth) return [];

  const requestedWindow = Number(requestedMonths);
  const windowLength = Number.isFinite(requestedWindow) && requestedWindow > 0 ? requestedWindow : periods.length || 1;
  const windowStart = shiftMonth(lastMonth, -(windowLength - 1));

  return periods
    .filter((period) => {
      if (!period?.periodo) return false;
      if (compareMonths(period.periodo, windowStart) < 0) return false;
      if (compareMonths(period.periodo, lastMonth) > 0) return false;
      if (accountStartMonth && compareMonths(period.periodo, accountStartMonth) < 0) return false;
      return true;
    })
    .sort((left, right) => compareMonths(left.periodo, right.periodo));
}

function EvolutionChart({ periods, accountStartMonth, evolutionEnd, requestedMonths }) {
  const visiblePeriods = getVisibleEvolutionPeriods(periods, accountStartMonth, evolutionEnd, requestedMonths);
  const max = Math.max(...visiblePeriods.map((period) => Number(period.total_centavos || 0)), 1);
  const { width } = useWindowDimensions();
  const [activePoint, setActivePoint] = useState(null);
  const [chartType, setChartType] = useState('line');
  const visiblePeriodKey = visiblePeriods.map((period) => period.periodo).join('|');
  useEffect(() => {
    setActivePoint((current) => (current && visiblePeriods.some((period) => period.periodo === current.period.periodo) ? current : null));
  }, [visiblePeriodKey]);

  const isCompactChart = visiblePeriods.length <= 2;
  const chartWidth = Math.max(width - 48, 280);
  const chartHeight = isCompactChart ? 214 : 236;
  const plotLeft = visiblePeriods.length <= 2 ? 40 : 48;
  const plotTop = isCompactChart ? 24 : 20;
  const plotRight = chartWidth - 10;
  const plotBottom = isCompactChart ? 166 : 184;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const pointInset = visiblePeriods.length === 1 ? 0 : visiblePeriods.length === 2 ? Math.min(42, plotWidth * 0.16) : visiblePeriods.length === 3 ? Math.min(18, plotWidth * 0.06) : 0;
  const pointLeft = plotLeft + pointInset;
  const pointRight = plotRight - pointInset;
  const points = visiblePeriods.map((period, index) => {
    const total = Number(period.total_centavos || 0);
    const x = visiblePeriods.length === 1 ? plotLeft + plotWidth / 2 : pointLeft + (index * (pointRight - pointLeft)) / (visiblePeriods.length - 1);
    const y = plotBottom - (total / max) * plotHeight;
    return { period, total, x, y };
  });
  const periodCount = Math.max(visiblePeriods.length, 1);
  const barGap = visiblePeriods.length <= 3 ? 16 : visiblePeriods.length <= 6 ? 8 : 4;
  const barMaxWidth = visiblePeriods.length === 1 ? 24 : visiblePeriods.length === 2 ? 26 : visiblePeriods.length === 3 ? 28 : 28;
  const barSlotWidth = (plotWidth - barGap * (periodCount - 1)) / periodCount;
  const barWidth = Math.max(12, Math.min(barMaxWidth, barSlotWidth));
  const barGroupWidth = barWidth * visiblePeriods.length + barGap * Math.max(visiblePeriods.length - 1, 0);
  const barGroupLeft = plotLeft + (plotWidth - barGroupWidth) / 2;
  const barPoints = points.map((point, index) => ({
    ...point,
    x: barGroupLeft + index * (barWidth + barGap) + barWidth / 2,
  }));
  const linePath = points.length === 2 ? `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}` : points.length > 2 ? buildSmoothPath(points) : '';
  const areaPath = points.length > 2 ? `${linePath} L ${points[points.length - 1].x} ${plotBottom} L ${points[0].x} ${plotBottom} Z` : '';

  if (!visiblePeriods.length) {
    return <EmptyComparison message="Nenhum mês disponível para este período." />;
  }

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Evolução dos gastos</Text>
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
      {visiblePeriods.length === 1 ? (
        <View style={styles.singlePeriodSummary}>
          <Text style={styles.singlePeriodLabel}>{monthLabel(visiblePeriods[0].periodo)}</Text>
          <Text style={styles.singlePeriodValue}>{formatCents(visiblePeriods[0].total_centavos)}</Text>
        </View>
      ) : activePoint ? (
        <View style={styles.pointTooltip}>
          <Text style={styles.pointTooltipLabel}>{monthLabel(activePoint.period.periodo)}</Text>
          <Text style={styles.pointTooltipValue}>{formatCents(activePoint.total)}</Text>
        </View>
      ) : null}
      <View style={[styles.evolutionChart, isCompactChart && styles.evolutionChartCompact]}>
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
          {chartType === 'bar'
            ? barPoints.map((point) => {
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
              })
            : null}
          {chartType === 'line'
            ? points.map((point) => (
                <Circle
                  key={`point-${point.period.periodo}`}
                  cx={point.x}
                  cy={point.y}
                  r={activePoint?.period.periodo === point.period.periodo ? 6 : 4}
                  fill="#FFFFFF"
                  stroke={COLORS.dadoDois}
                  strokeWidth="3"
                />
              ))
            : null}
        </Svg>
        <View style={styles.evolutionTouchLayer}>
          {(chartType === 'bar' ? barPoints : points).map((point) => (
            <TouchableOpacity
              key={`touch-${point.period.periodo}`}
              style={[styles.evolutionTouchPoint, { left: point.x - 16, top: point.y - 16 }]}
              onPress={() => setActivePoint(point)}
              accessibilityRole="button"
              accessibilityLabel={`${monthLabel(point.period.periodo)}: ${formatCents(point.total)}`}
            />
          ))}
        </View>
        <View
          style={[
            styles.evolutionLabels,
            {
              left: chartType === 'bar' ? barGroupLeft : pointLeft,
              width: chartType === 'bar' ? barGroupWidth : pointRight - pointLeft,
            },
          ]}>
          {visiblePeriods.map((period) => (
            <Text key={period.periodo} style={[styles.evolutionLabel, visiblePeriods.length > 8 && styles.evolutionLabelCompact]}>
              {monthShortLabel(period.periodo)}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function ComparisonSummary({ comparison }) {
  const total = comparison?.total;
  if (!total) return null;
  const baseMonth = comparison.periodo_base;
  const comparedMonth = comparison.periodo_comparado;
  const difference = Number(total.diferenca || 0);
  const differenceTone = difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'neutral';
  const differenceLabel = difference > 0 ? 'Aumento' : difference < 0 ? 'Redução' : 'Sem alteração';

  return (
    <View style={styles.comparisonSummary}>
      <View style={styles.comparisonSummaryHeader}>
        <Text style={styles.chartTitle}>Resumo da comparação</Text>
      </View>
      <View style={styles.comparisonMetricRow}>
        <View style={styles.comparisonMetric}>
          <Text style={styles.comparisonMetricLabel}>{monthLabel(baseMonth)}</Text>
          <Text style={styles.comparisonMetricValue}>{formatCents(total.base)}</Text>
        </View>
        <View style={styles.comparisonMetricDivider} />
        <View style={styles.comparisonMetric}>
          <Text style={styles.comparisonMetricLabel}>{monthLabel(comparedMonth)}</Text>
          <Text style={styles.comparisonMetricValue}>{formatCents(total.comparado)}</Text>
        </View>
      </View>
      <View style={styles.comparisonVisualBlock}>
        <View style={styles.comparisonVisualHeader}>
          <Text style={styles.comparisonMetricLabel}>Distribuição do gasto total</Text>
        </View>
        <View style={styles.comparisonVisualRow}>
          <Text style={styles.comparisonVisualPeriodLabel}>{monthShortLabel(baseMonth)}</Text>
          <View style={styles.comparisonVisualTrack}>
            <View style={[styles.comparisonVisualFillA, { width: `${Math.max((Number(total.base || 0) / Math.max(Number(total.base || 0), Number(total.comparado || 0), 1)) * 100, 2)}%` }]} />
          </View>
        </View>
        <View style={styles.comparisonVisualRow}>
          <Text style={styles.comparisonVisualPeriodLabel}>{monthShortLabel(comparedMonth)}</Text>
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
    </View>
  );
}

function PaymentComparisonChart({ periods }) {
  const [expanded, setExpanded] = useState(false);
  const rowsByLabel = new Map();
  const baseMonth = periods?.[0]?.periodo;
  const comparedMonth = periods?.[1]?.periodo;

  (periods || []).slice(0, 2).forEach((period, periodIndex) => {
    (period.formas_pagamento || []).forEach((item) => {
      const label = item.forma_pagamento_nome || 'Não informado';
      const current = rowsByLabel.get(label) || { label, base: 0, compared: 0 };
      current[periodIndex === 0 ? 'base' : 'compared'] = Number(item.total_centavos || 0);
      rowsByLabel.set(label, current);
    });
  });

  const rows = [...rowsByLabel.values()].sort((left, right) => right.base + right.compared - left.base - left.compared);
  if (!rows.length) return <EmptyComparison message="Nenhum gasto por forma de pagamento neste período." />;

  const visibleRows = expanded ? rows : rows.slice(0, 4);
  const max = Math.max(...rows.flatMap((row) => [row.base, row.compared]), 1);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Formas de pagamento</Text>
        </View>
        <View style={styles.legendInline}>
          <ComparisonPeriodTag month={baseMonth} color={COMPARISON_COLORS.base} compact />
          <ComparisonPeriodTag month={comparedMonth} color={COMPARISON_COLORS.compared} compact />
        </View>
      </View>
      {visibleRows.map((row) => {
        return (
          <View key={row.label} style={styles.categoryComparisonRow}>
            <View style={styles.categoryComparisonHeader}>
              <Text style={styles.categoryComparisonName} numberOfLines={1}>
                {row.label}
              </Text>
            </View>
            <View style={styles.categoryBarRow}>
              <View style={styles.categoryBarTrack}>
                <View style={[styles.categoryBarFill, { width: `${(row.base / max) * 100}%`, backgroundColor: COMPARISON_COLORS.base }]} />
              </View>
              <Text style={styles.categoryBarValue}>{formatCents(row.base)}</Text>
            </View>
            <View style={styles.categoryBarRow}>
              <View style={styles.categoryBarTrack}>
                <View style={[styles.categoryBarFill, { width: `${(row.compared / max) * 100}%`, backgroundColor: COMPARISON_COLORS.compared }]} />
              </View>
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

function CategoryComparisonChart({ categories, periods }) {
  const [expanded, setExpanded] = useState(false);
  if (!categories?.length) {
    return <EmptyComparison message="Nenhum gasto por categoria neste período." />;
  }

  const orderedCategories = [...categories].sort((left, right) => {
    const leftTotal = Number(left.base_total_centavos || 0) + Number(left.comparado_total_centavos || 0);
    const rightTotal = Number(right.base_total_centavos || 0) + Number(right.comparado_total_centavos || 0);
    return rightTotal - leftTotal;
  });
  const visibleCategories = expanded ? orderedCategories : orderedCategories.slice(0, 5);
  const max = Math.max(...visibleCategories.flatMap((category) => [category.base_total_centavos, category.comparado_total_centavos]), 1);
  const baseMonth = periods?.[0]?.periodo;
  const comparedMonth = periods?.[1]?.periodo;

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Categorias</Text>
        </View>
        <View style={styles.legendInline}>
          <ComparisonPeriodTag month={baseMonth} color={COMPARISON_COLORS.base} compact />
          <ComparisonPeriodTag month={comparedMonth} color={COMPARISON_COLORS.compared} compact />
        </View>
      </View>
      {visibleCategories.map((category) => (
        <View key={category.categoria_id} style={styles.categoryComparisonRow}>
          <View style={styles.categoryComparisonHeader}>
            <Text style={styles.categoryComparisonName} numberOfLines={1}>
              {category.categoria_nome}
            </Text>
          </View>
          <View style={styles.categoryBarRow}>
            <View style={styles.categoryBarTrack}>
              <View style={[styles.categoryBarFill, { width: `${(category.base_total_centavos / max) * 100}%`, backgroundColor: COMPARISON_COLORS.base }]} />
            </View>
            <Text style={styles.categoryBarValue}>{formatCents(category.base_total_centavos)}</Text>
          </View>
          <View style={styles.categoryBarRow}>
            <View style={styles.categoryBarTrack}>
              <View style={[styles.categoryBarFill, { width: `${(category.comparado_total_centavos / max) * 100}%`, backgroundColor: COMPARISON_COLORS.compared }]} />
            </View>
            <Text style={styles.categoryBarValue}>{formatCents(category.comparado_total_centavos)}</Text>
          </View>
        </View>
      ))}
      {orderedCategories.length > 5 ? (
        <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded((current) => !current)} activeOpacity={0.8}>
          <Text style={styles.expandButtonText}>{expanded ? 'Mostrar principais' : `Ver todas as categorias (${orderedCategories.length})`}</Text>
          <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.dadoDois} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ComparisonControls({ mode, setMode, months, setMonths, evolutionEnd, compareMonthA, compareMonthB, onOpenPicker }) {
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
            </View>
          </View>
          <View style={styles.segmentedControl}>
            {[6, 12].map((option) => (
              <TouchableOpacity key={option} style={[styles.segmentButton, months === option && styles.segmentButtonActive]} onPress={() => setMonths(option)}>
                <Text style={[styles.segmentButtonText, months === option && styles.segmentButtonTextActive]}>{option} meses</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.periodEndRow}>
            <View style={styles.periodEndCopy}>
              <Text style={styles.periodEndLabel}>Período final</Text>
              <Text style={styles.periodEndHint}>Exibir a janela até</Text>
            </View>
            <TouchableOpacity
              style={styles.periodEndButton}
              onPress={() => onOpenPicker('evolutionEnd')}
              accessibilityRole="button"
              accessibilityLabel={`Período final: até ${monthLabel(evolutionEnd)}`}>
              <Text style={styles.periodEndButtonPrefix}>Até</Text>
              <Text style={styles.periodEndButtonValue}>{monthLabel(evolutionEnd)}</Text>
              <MaterialCommunityIcons name="calendar-month-outline" size={17} color={COLORS.dadoUm} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.controlCard}>
          <Text style={styles.controlTitle}>Escolha os períodos</Text>
          <View style={styles.comparePickerRow}>
            <TouchableOpacity
              style={[styles.comparePickerButton, { borderTopColor: COMPARISON_COLORS.base }]}
              onPress={() => onOpenPicker('monthA')}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar ${monthLabel(compareMonthA)}`}>
              <View style={styles.comparePickerValueRow}>
                <View style={[styles.comparisonPeriodDot, { backgroundColor: COMPARISON_COLORS.base }]} />
                <Text style={styles.comparePickerValue} numberOfLines={1}>
                  {monthLabel(compareMonthA)}
                </Text>
              </View>
            </TouchableOpacity>
            <MaterialCommunityIcons name="compare-horizontal" size={23} color={COLORS.dadoDois} />
            <TouchableOpacity
              style={[styles.comparePickerButton, { borderTopColor: COMPARISON_COLORS.compared }]}
              onPress={() => onOpenPicker('monthB')}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar ${monthLabel(compareMonthB)}`}>
              <View style={styles.comparePickerValueRow}>
                <View style={[styles.comparisonPeriodDot, { backgroundColor: COMPARISON_COLORS.compared }]} />
                <Text style={styles.comparePickerValue} numberOfLines={1}>
                  {monthLabel(compareMonthB)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {compareMonthA === compareMonthB ? <Text style={styles.validationText}>Escolha dois meses diferentes para comparar.</Text> : null}
        </View>
      )}
    </>
  );
}

export default function DashboardScreen({ route, navigation }) {
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const isFocused = useIsFocused();
  const { fetchTempoUso, fetchUsuario } = useDataRefresh();
  const incomingPeriod = route?.params?.periodo;
  const routeIndicator = route?.params?.indicador;
  const pagerRef = useRef(null);
  const overviewScrollRef = useRef(null);
  const overviewSectionPositionsRef = useRef({});
  const usageFocusRequest = route?.params?.focoTempo;
  const overviewMeasurementVersionRef = useRef(0);
  const overviewSectionNodesRef = useRef({});
  const overviewContentRef = useRef(null);
  const pendingOverviewSectionRef = useRef(null);
  const overviewAbortRef = useRef(null);
  const contextAbortRef = useRef(null);
  const comparisonAbortRef = useRef(null);
  const overviewRequestRef = useRef(0);
  const contextRequestRef = useRef(0);
  const comparisonRequestRef = useRef(0);

  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(() => (isValidMonth(incomingPeriod) && compareMonths(incomingPeriod, currentMonth) <= 0 ? incomingPeriod : currentMonth));
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
  const [isMetricCarouselActive, setIsMetricCarouselActive] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const maxMonth = currentMonth;
  const accountStartMonth = getMonthInTimezone(usuario?.usuario_data_criacao);
  const financeiro = useResumoHome(selectedMonth);
  const tempoUsoLoading = overviewLoading;
  const comportamento = useAnaliseComportamento(selectedMonth);
  const overviewSection = routeIndicator === 'tempo'
    ? 'tempo'
    : routeIndicator === 'categorias'
      ? 'categories'
      : routeIndicator === 'compras'
        ? 'indicators'
        : routeIndicator === 'orientacoes'
          ? 'comportamento'
          : routeIndicator === 'gastos'
            ? 'financial'
            : null;

  useEffect(() => {
    if (!isValidMonth(incomingPeriod) || compareMonths(incomingPeriod, currentMonth) > 0) return;
    if (accountStartMonth && compareMonths(incomingPeriod, accountStartMonth) < 0) return;
    setSelectedMonth(current => current === incomingPeriod ? current : incomingPeriod);
    // O detalhe da Home seleciona o mês da visão geral e preserva os filtros de comparação.
    if (routeIndicator === 'tempo') return;
    setEvolutionEnd(current => current === incomingPeriod ? current : incomingPeriod);
    setCompareMonthB(current => current === incomingPeriod ? current : incomingPeriod);
    const previousMonth = shiftMonth(incomingPeriod, -1);
    setCompareMonthA(current => current === previousMonth ? current : previousMonth);
  }, [accountStartMonth, currentMonth, incomingPeriod, usageFocusRequest, routeIndicator]);
  useEffect(() => {
    if (isFocused && overviewSection) setActiveTab(0);
  }, [isFocused, overviewSection, incomingPeriod, usageFocusRequest]);
  useEffect(() => {
    if (!isFocused || activeTab !== 0 || !overviewSection) return;
    overviewMeasurementVersionRef.current++;
    overviewSectionPositionsRef.current = {};
    pendingOverviewSectionRef.current = overviewSection;
    return () => {
      overviewMeasurementVersionRef.current++;
      pendingOverviewSectionRef.current = null;
    };
  }, [activeTab, overviewSection, incomingPeriod, isFocused, usageFocusRequest]);

  // Aguarda o período e os cartões carregarem antes de concluir a navegação.
  // A medição nativa acompanha mudanças de layout sem temporizadores.
  const scrollToOverviewSection = useCallback(() => {
    const section = pendingOverviewSectionRef.current;
    const position = overviewSectionPositionsRef.current[section];
    if (!section || !isFocused || activeTab !== 0 || overviewLoading || financeiro.loading || tempoUsoLoading) return;
    if (incomingPeriod && selectedMonth !== incomingPeriod) return;
    if (!position || position.month !== selectedMonth || !overviewScrollRef.current) return;
    overviewScrollRef.current.scrollTo({
      y: Math.max(0, position.y - 12),
      animated: true
    });
    pendingOverviewSectionRef.current = null;
    navigation.setParams?.({
      indicador: undefined,
      periodo: undefined,
      focoTempo: undefined
    });
  }, [isFocused, activeTab, overviewLoading, financeiro.loading, tempoUsoLoading, incomingPeriod, selectedMonth, navigation, usageFocusRequest]);
  const measureOverviewSection = useCallback(() => {
    // Mede a posição no conteúdo do ScrollView após a atualização do React.
    // O retorno nativo de measureLayout considera mudanças assíncronas do layout.
    if (!pendingOverviewSectionRef.current) return;
    const version = overviewMeasurementVersionRef.current;
    const section = pendingOverviewSectionRef.current;
    const node = overviewSectionNodesRef.current[section];
    node?.measureLayout?.(overviewContentRef.current, (_x, y) => {
      if (version !== overviewMeasurementVersionRef.current) return;
      overviewSectionPositionsRef.current[section] = {
        y,
        month: selectedMonth
      };
      scrollToOverviewSection();
    }, () => {});
  }, [selectedMonth, scrollToOverviewSection]);
  useEffect(measureOverviewSection, [measureOverviewSection]);
  const markOverviewSection = useCallback(section => event => {
    const y = event.nativeEvent.layout.y;
    overviewSectionPositionsRef.current[section] = {
      y,
      month: selectedMonth
    };
    scrollToOverviewSection();
  }, [selectedMonth, scrollToOverviewSection]);
  const mark = markOverviewSection;
  const openPicker = useCallback((target) => setPickerTarget(target), []);
  const closePicker = useCallback(() => setPickerTarget(null), []);

  const pickerValue = pickerTarget === 'evolutionEnd' ? evolutionEnd : pickerTarget === 'monthA' ? compareMonthA : pickerTarget === 'monthB' ? compareMonthB : selectedMonth;

  const handlePickerChange = useCallback(
    (value) => {
      if (pickerTarget === 'evolutionEnd') setEvolutionEnd(value);
      else if (pickerTarget === 'monthA') setCompareMonthA(value);
      else if (pickerTarget === 'monthB') setCompareMonthB(value);
      else setSelectedMonth(value);
    },
    [pickerTarget],
  );

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
      const data = await getDashboardAnalytics({
        mode: 'month',
        month: selectedMonth
      }, {
        signal: controller.signal
      });
      if (requestId !== overviewRequestRef.current || controller.signal.aborted) return;
      setOverviewData(data);
    } catch (error) {
      if (requestId !== overviewRequestRef.current || isCanceled(error)) return;
      logApiErrors(error, 'Erro ao buscar analytics do período', true, diagnosticoAnalytics(error, {
        mode: 'month',
        month: selectedMonth
      }));
      setOverviewError(mensagemErroAnalytics(error));
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

    const params = comparisonMode === 'evolution' ? { mode: 'evolution', months: evolutionMonths, end: evolutionEnd } : { mode: 'compare', monthA: compareMonthA, monthB: compareMonthB };

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
      const unsubscribe = observarAtualizacaoTempoUso(() => {
        loadContext();
      });
      return unsubscribe;
    }, [loadContext, loadOverview]),
  );

  useEffect(() => {
    if (isFocused && activeTab === 1) loadComparison();
  }, [activeTab, isFocused, loadComparison]);

  useEffect(
    () => () => {
      overviewAbortRef.current?.abort();
      contextAbortRef.current?.abort();
      comparisonAbortRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    pagerRef.current?.scrollTo({ x: activeTab * width, animated: false });
  }, [activeTab, width]);

  const selectTab = useCallback(
    (index) => {
      setActiveTab(index);
      pagerRef.current?.scrollTo({ x: index * width, animated: true });
    },
    [width],
  );

  const handlePagerEnd = useCallback(
    (event) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1));
      if (index !== activeTab) setActiveTab(index);
    },
    [activeTab, width],
  );

  const descobertasResumo = useDescobertasResumo(selectedMonth);
  const handleRefresh = useCallback(() => {
    descobertasResumo.refresh();
    if (activeTab === 0) {
      loadOverview();
      loadContext();
      comportamento.refresh();
    } else {
      loadComparison();
    }
  }, [activeTab, comportamento.refresh, descobertasResumo.refresh, loadComparison, loadContext, loadOverview]);

  const period = overviewData?.periodos?.[0] || null;
  const limitData = period?.compras_acima_limite || { acima_limite: 0, dentro_limite: 0 };
  const limitTotal = Number(limitData.acima_limite || 0) + Number(limitData.dentro_limite || 0);
  const limitIndicatorColor = corPorProporcao(limitData.acima_limite, limitTotal, 'RISCO');
  const dailyUsageMinutes = segundosHistoricoUso(filtrarHistoricoUso(tempoUso, selectedMonth)) / 60;
  const configuredBudget = Number(usuario?.usuario_meta_valor_mensal);
  const configuredBudgetCents = Number.isFinite(configuredBudget) && configuredBudget > 0
    ? Math.round(configuredBudget * 100)
    : null;
  const resumoFinanceiro = apresentarMeiaLua(
    financeiro.loading || financeiro.error ? null : financeiro.dados,
    configuredBudgetCents,
  );
  const totalCents = resumoFinanceiro.compras;
  const metaCents = resumoFinanceiro.orcamento;
  const metaValue = metaCents === null ? null : metaCents / 100;
  const metaUsagePercent = resumoFinanceiro.percentual;
  const metaExcessCents = resumoFinanceiro.excesso;
  const metaStatusColor = resumoFinanceiro.cor || COLORS.dadoUm;
  const financialScaleCents = Math.max(totalCents, metaCents, 1);
  const limitBarWidth = metaCents > 0 ? Math.min(100, (metaCents / financialScaleCents) * 100) : 0;
  const spentBarWidth = totalCents > 0 ? Math.min(100, (totalCents / financialScaleCents) * 100) : 0;
  const metricCards = [{
    key: 'acima-limite',
    label: 'Acima do limite',
    value: String(limitData.acima_limite || 0),
    subtitle: `${limitData.dentro_limite || 0} dentro do limite`,
    subtitleColor: limitIndicatorColor,
    iconColor: limitIndicatorColor,
    icon: 'alert-circle-outline'
  }, {
    key: 'descontos',
    label: 'Descontos',
    value: formatCents(period?.desconto_centavos || 0),
    subtitle: 'economia registrada',
    iconColor: COLORS.dadoDois,
    icon: 'sale'
  }, {
    key: 'tempo-sites',
    label: 'Tempo em aplicativos',
    value: usageMonitoringReadsEnabled ? 'Ver tempo registrado' : formatDailyDuration(dailyUsageMinutes),
    subtitle: usageMonitoringReadsEnabled ? 'tempo em aplicativos no mês' : dailyUsageMinutes > 0 ? 'registrado no mês' : 'nenhum registro no mês',
    iconColor: COLORS.customButtonFundo,
    icon: 'clock-outline'
  }];
  const renderOverview = () => {
    if (overviewLoading && !overviewData) return <LoadingState />;
    if (overviewError && !overviewData) return <ErrorState message={overviewError} onRetry={loadOverview} />;

    return (
      <ScrollView
        ref={overviewScrollRef}
        onContentSizeChange={measureOverviewSection}
        style={styles.pageScroll}
        contentContainerStyle={[styles.pageContent, { paddingBottom: tabBarHeight + 28 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={overviewLoading} onRefresh={handleRefresh} tintColor={COLORS.dadoDois} />}>
        <PeriodSelector
          value={selectedMonth}
          onPress={() => setMonthPickerOpen(true)}
          onPurchasesPress={() => navigation.navigate('Purchases')}
          label="Mês analisado"
        />

        <View onLayout={mark('financial')} style={styles.financialSummaryCard}>
          <View style={styles.financialSummaryHeader}>
            <View>
              <Text style={styles.financialSummaryEyebrow}>Resumo financeiro</Text>
              <Text style={styles.financialSummaryLabel}>Gastos do mês</Text>
            </View>
          </View>

          {financeiro.loading && !financeiro.dados ? (
            <View style={styles.noLimitState}>
              <ActivityIndicator color={COLORS.dadoDois} />
              <Text style={styles.noLimitText}>Atualizando o resumo financeiro.</Text>
            </View>
          ) : financeiro.error && !financeiro.dados ? (
            <View style={styles.noLimitState}>
              <Text style={styles.noLimitTitle}>Resumo financeiro indisponível</Text>
              <Text style={styles.noLimitText}>Não foi possível carregar os dados deste período.</Text>
              <CustomButton title="Tentar novamente" variant="outline" icon="refresh" onPress={financeiro.refresh} style={styles.retryButton} />
            </View>
          ) : (
            <>
              <Text style={styles.financialSummaryValue}>
                {totalCents === null ? 'Valor não informado' : formatCents(totalCents)}
              </Text>

              {metaCents !== null && metaCents > 0 ? (
                <View style={styles.financialBars}>
                  <View style={styles.financialBarRow}>
                    <View style={styles.financialBarHeader}>
                      <Text style={styles.financialBarLabel}>Limite mensal</Text>
                      <Text style={styles.financialBarValue}>{formatReais(metaValue)}</Text>
                    </View>
                    <View
                      style={styles.financialBarTrack}
                      accessible
                      accessibilityRole="progressbar"
                      accessibilityLabel={`Limite mensal de ${formatReais(metaValue)}`}>
                      <View style={[styles.financialBarFill, styles.financialBarLimitFill, { width: `${limitBarWidth}%` }]} />
                    </View>
                  </View>
                  <View style={styles.financialBarRow}>
                    <View style={styles.financialBarHeader}>
                      <Text style={styles.financialBarLabel}>Gastos do mês</Text>
                      <Text style={styles.financialBarValue}>{totalCents === null ? '--' : formatCents(totalCents)}</Text>
                    </View>
                    <View
                      style={styles.financialBarTrack}
                      accessible
                      accessibilityRole="progressbar"
                      accessibilityLabel={`Gastos do mês de ${totalCents === null ? 'valor não informado' : formatCents(totalCents)}`}>
                      <View style={[styles.financialBarFill, styles.financialBarSpentFill, { width: `${spentBarWidth}%`, backgroundColor: metaStatusColor }]} />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.noLimitState}>
                  <Text style={styles.noLimitTitle}>Limite mensal não configurado</Text>
                  <Text style={styles.noLimitText}>{resumoFinanceiro.mensagem}.</Text>
                </View>
              )}

              <View style={styles.financialSummaryStatus}>
                {metaExcessCents !== null && metaExcessCents > 0 ? (
                  <View style={styles.financialSummaryExcess}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color={metaStatusColor} />
                    <Text style={[styles.financialSummaryExcessText, { color: metaStatusColor }]}>
                      {formatCents(metaExcessCents)} acima do limite
                    </Text>
                  </View>
                ) : null}
                {metaUsagePercent !== null ? (
                  <View style={styles.financialSummaryPercentBlock}>
                    <Text style={[styles.financialSummaryPercentValue, { color: metaStatusColor }]}>{metaUsagePercent.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%</Text>
                  </View>
                ) : null}
              </View>
            </>
          )}
        </View>

        {!period || period.quantidade_compras === 0 ? (
          <View style={styles.emptyPeriodBanner}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={20} color={COLORS.dadoTres} />
            <View style={styles.emptyPeriodCopy}>
              <Text style={styles.emptyPeriodTitle}>Nenhuma compra neste mês</Text>
            </View>
          </View>
        ) : null}

        <View onLayout={mark('indicators')}>
          <ResumoMensalCarousel
            monthTitle="Indicadores do período"
            cards={metricCards}
            sectionStyle={styles.periodIndicatorsSection}
            cardStyle={styles.periodIndicatorsCard}
            scrollContentStyle={styles.periodIndicatorsContent}
            onInteractionChange={setIsMetricCarouselActive}
          />
        </View>

        <View onLayout={mark('comportamento')}>
          <AnaliseComportamento
            dados={comportamento.dados}
            loading={comportamento.loading}
            error={comportamento.error}
            onRetry={comportamento.refresh}
          />
        </View>

        <View onLayout={mark('categories')}>
          <Categoria gastosCategoria={period?.categorias || []} onSelect={categoriaId => navigation.navigate('Purchases', { filtroConsumo: { periodo: selectedMonth, timezone: ANALYTICS_TIMEZONE, categoriaId } })} />
        </View>
        <FormaPagamento gastosFormaPagamento={period?.formas_pagamento || []} />
        <Impulsividade data={period?.impulsividade || []} />
        <DescobertasDashboard dados={descobertasResumo.dados} onOpen={() => navigation.navigate('Purchases', { filtroConsumo: { periodo: selectedMonth, timezone: 'America/Sao_Paulo' } })} />
        <MovimentacoesCompra eventos={descobertasResumo.dados?.eventos} />
        <Impulsividade
          data={limitData}
          title="Compras acima do limite"
          emptyMessage="Nenhuma compra registrada neste período"
          centerLabel="acima do limite"
          centerValueMode="quantity"
          totalKey="acima_limite"
          observedPurchaseCount={period?.quantidade_compras ?? null}
        />
        <View ref={node => { overviewSectionNodesRef.current.tempo = node; }} collapsable={false} onLayout={mark('tempo')}>
          {usageMonitoringReadsEnabled ? <UsageTimePanel month={selectedMonth} onSettings={() => navigation.navigate('Profile')} /> : <TempoApp tempoUso={tempoUso} mes={selectedMonth} />}
        </View>
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
      {!comparisonLoading && !comparisonError && comparisonData && comparisonMode === 'evolution' ? (
        <EvolutionChart periods={comparisonData.periodos || []} accountStartMonth={accountStartMonth} evolutionEnd={evolutionEnd} requestedMonths={evolutionMonths} />
      ) : null}
      {!comparisonLoading && !comparisonError && comparisonData && comparisonMode === 'compare' ? (
        <>
          <ComparisonSummary comparison={comparisonData.comparacao} />
          <CategoryComparisonChart categories={comparisonData.comparacao?.categorias || []} periods={comparisonData.periodos || []} />
          <PaymentComparisonChart periods={comparisonData.periodos || []} />
        </>
      ) : null}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        scrollEnabled={!isMetricCarouselActive}
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
        title={pickerTarget === 'evolutionEnd' ? 'Fim da evolução' : 'Selecionar período'}
        onChange={handlePickerChange}
        onClose={closePicker}
      />
    </SafeAreaView>
  );
}
