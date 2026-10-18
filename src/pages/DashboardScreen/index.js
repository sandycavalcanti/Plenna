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
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';
import { getDashboardAnalytics } from '../../api/dashboard';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { useAnaliseComportamento } from '../../hooks/useAnaliseComportamento';
import { logApiErrors } from '../../utils/error';
import { obterJanelaDiaLocal } from '../../utils/tempoUsoSync';
import { observarAtualizacaoTempoUso } from '../../utils/tempoUsoAtualizacao';
import { styles } from './styles';

const ANALYTICS_TIMEZONE = 'America/Sao_Paulo';
const DASHBOARD_COLORS = DASHBOARD_THEME.colors;
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

function getDailyUsageMinutes(records) {
  const { dataLocal: today } = obterJanelaDiaLocal();

  return records.reduce((total, item) => {
    if (item?.tempo_uso_data_local !== today || !item?.tempo_uso_nome) return total;

    const seconds = Number(item?.tempo_uso_duracao_segundos);
    const minutes = Number.isFinite(seconds) && seconds > 0 ? seconds / 60 : Number(item?.tempo_uso_minutos);

    return Number.isFinite(minutes) && minutes > 0 ? total + minutes : total;
  }, 0);
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
    return <EmptyComparison message="Não há meses disponíveis desde a criação da conta neste período." />;
  }

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
      <Text style={styles.chartFootnote}>Meses sem compras aparecem como zero.</Text>
    </View>
  );
}

function ComparisonSummary({ comparison }) {
  const total = comparison?.total;
  const quantity = comparison?.quantidade_compras;
  if (!total || !quantity) return null;
  const baseMonth = comparison.periodo_base;
  const comparedMonth = comparison.periodo_comparado;
  const difference = Number(total.diferenca || 0);
  const differenceTone = difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'neutral';
  const differenceLabel = difference > 0 ? 'Aumento' : difference < 0 ? 'Redução' : 'Sem alteração';

  return (
    <View style={styles.comparisonSummary}>
      <View style={styles.comparisonSummaryHeader}>
        <Text style={styles.chartTitle}>Resumo da comparação</Text>
        <Text style={styles.comparisonSummaryPeriods}>
          {monthLabel(baseMonth)} × {monthLabel(comparedMonth)}
        </Text>
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
      <View style={styles.purchaseCountRow}>
        <MaterialCommunityIcons name="cart-outline" size={18} color={COLORS.dadoUm} />
        <Text style={styles.purchaseCountText}>
          {quantity.base} compras em {monthShortLabel(baseMonth)} · {quantity.comparado} em {monthShortLabel(comparedMonth)}
        </Text>
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
          <ComparisonPeriodTag month={baseMonth} color={COMPARISON_COLORS.base} compact />
          <ComparisonPeriodTag month={comparedMonth} color={COMPARISON_COLORS.compared} compact />
        </View>
      </View>
      {visibleRows.map((row) => {
        const difference = row.compared - row.base;
        const variation = row.base === 0 ? null : (difference / row.base) * 100;
        return (
          <View key={row.label} style={styles.categoryComparisonRow}>
            <View style={styles.categoryComparisonHeader}>
              <Text style={styles.categoryComparisonName} numberOfLines={1}>
                {row.label}
              </Text>
              <Text style={styles.categoryComparisonVariation} numberOfLines={2}>
                {formatSignedCents(difference)} · {formatPercent(variation)}
              </Text>
            </View>
            <View style={styles.categoryBarRow}>
              <View style={[styles.categoryBarMarker, { backgroundColor: COMPARISON_COLORS.base }]} />
              <View style={styles.categoryBarTrack}>
                <View style={[styles.categoryBarFill, { width: `${(row.base / max) * 100}%`, backgroundColor: COMPARISON_COLORS.base }]} />
              </View>
              <Text style={styles.categoryBarValue}>{formatCents(row.base)}</Text>
            </View>
            <View style={styles.categoryBarRow}>
              <View style={[styles.categoryBarMarker, { backgroundColor: COMPARISON_COLORS.compared }]} />
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
    return <EmptyComparison message="Nenhuma categoria apareceu nos períodos escolhidos." />;
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
          <Text style={styles.chartSubtitle}>Comparação por gasto bruto</Text>
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
            <Text style={styles.categoryComparisonVariation} numberOfLines={2}>
              Δ {formatSignedCents(category.diferenca_centavos)} · {formatPercent(category.variacao_percentual)}
            </Text>
          </View>
          <View style={styles.categoryBarRow}>
            <View style={[styles.categoryBarMarker, { backgroundColor: COMPARISON_COLORS.base }]} />
            <View style={styles.categoryBarTrack}>
              <View style={[styles.categoryBarFill, { width: `${(category.base_total_centavos / max) * 100}%`, backgroundColor: COMPARISON_COLORS.base }]} />
            </View>
            <Text style={styles.categoryBarValue}>{formatCents(category.base_total_centavos)}</Text>
          </View>
          <View style={styles.categoryBarRow}>
            <View style={[styles.categoryBarMarker, { backgroundColor: COMPARISON_COLORS.compared }]} />
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
              <Text style={styles.controlSubtitle}>Escolha quantos meses visualizar</Text>
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
          <Text style={styles.controlSubtitle}>Meses diferentes e até anos diferentes</Text>
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
            <MaterialCommunityIcons name="compare-arrows" size={23} color={COLORS.dadoDois} />
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

export default function DashboardScreen({ route }) {
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const isFocused = useIsFocused();
  const { fetchTempoUso, fetchUsuario } = useDataRefresh();
  const incomingPeriod = route?.params?.periodo;
  const routeIndicator = route?.params?.indicador;
  const pagerRef = useRef(null);
  const overviewScrollRef = useRef(null);
  const overviewSectionPositionsRef = useRef({});
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
  const comportamento = useAnaliseComportamento(selectedMonth);
  const overviewSection = routeIndicator === 'tempo'
    ? 'tempo'
    : routeIndicator === 'categorias'
      ? 'categories'
      : routeIndicator === 'compras'
        ? 'indicators'
        : routeIndicator === 'orientacoes'
          ? 'rf018'
          : routeIndicator === 'gastos'
            ? 'financial'
            : null;

  useEffect(() => {
    if (!isValidMonth(incomingPeriod) || compareMonths(incomingPeriod, currentMonth) > 0) return;
    if (accountStartMonth && compareMonths(incomingPeriod, accountStartMonth) < 0) return;
    setSelectedMonth((current) => (current === incomingPeriod ? current : incomingPeriod));
    setEvolutionEnd((current) => (current === incomingPeriod ? current : incomingPeriod));
    setCompareMonthB((current) => (current === incomingPeriod ? current : incomingPeriod));
    const previousMonth = shiftMonth(incomingPeriod, -1);
    setCompareMonthA((current) => (current === previousMonth ? current : previousMonth));
  }, [accountStartMonth, currentMonth, incomingPeriod]);

  useEffect(() => {
    if (activeTab !== 0 || !overviewSection) return;
    pendingOverviewSectionRef.current = overviewSection;
    const y = overviewSectionPositionsRef.current[overviewSection];
    if (typeof y === 'number') {
      overviewScrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
      pendingOverviewSectionRef.current = null;
    }
  }, [activeTab, overviewSection, selectedMonth]);

  const markOverviewSection = useCallback((section) => (event) => {
    const y = event.nativeEvent.layout.y;
    overviewSectionPositionsRef.current[section] = y;
    if (pendingOverviewSectionRef.current === section) {
      overviewScrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
      pendingOverviewSectionRef.current = null;
    }
  }, []);
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

  const handleRefresh = useCallback(() => {
    if (activeTab === 0) {
      loadOverview();
      loadContext();
      comportamento.refresh();
    } else {
      loadComparison();
    }
  }, [activeTab, comportamento.refresh, loadComparison, loadContext, loadOverview]);

  const period = overviewData?.periodos?.[0] || null;
  const metaValue = Number(usuario?.usuario_meta_valor_mensal || 0);
  const metaCents = Math.round(metaValue * 100);
  const totalCents = Number(period?.total_centavos || 0);
  const metaUsagePercent = metaCents > 0 ? (totalCents / metaCents) * 100 : 0;
  const metaStatus = metaCents <= 0 ? 'undefined' : metaUsagePercent > 100 ? 'exceeded' : metaUsagePercent >= 80 ? 'near' : 'within';
  const metaExcessCents = metaCents > 0 ? Math.max(totalCents - metaCents, 0) : 0;
  const metaStatusColor = {
    undefined: COLORS.dadoUm,
    exceeded: COLORS.dashboardGastosGeraisAviso,
    near: DASHBOARD_COLORS.caution,
    within: DASHBOARD_COLORS.positive,
  }[metaStatus];
  const limitData = period?.compras_acima_limite || { acima_limite: 0, dentro_limite: 0 };
  const isHistoricalMonth = selectedMonth !== currentMonth;
  const dailyUsageMinutes = getDailyUsageMinutes(tempoUso);
  const financialScaleCents = Math.max(totalCents, metaCents, 1);
  const spentWithinLimitWidth = metaCents > 0 ? (Math.min(totalCents, metaCents) / financialScaleCents) * 100 : 0;
  const spentExcessWidth = metaCents > 0 ? (Math.max(totalCents - metaCents, 0) / financialScaleCents) * 100 : 0;
  const limitWidth = metaCents > 0 ? (metaCents / financialScaleCents) * 100 : 0;
  const usagePercentValue = metaCents > 0 ? `${metaUsagePercent.toFixed(2).replace('.', ',')}%` : null;
  const metricCards = [
    {
      key: 'acima-limite',
      label: 'Acima do limite',
      value: String(limitData.acima_limite || 0),
      subtitle: `${limitData.dentro_limite || 0} dentro do limite`,
      iconColor: COLORS.dashboardGastosGeraisAviso,
      icon: 'alert-circle-outline',
    },
    { key: 'descontos', label: 'Descontos', value: formatCents(period?.desconto_centavos || 0), subtitle: 'economia registrada', iconColor: COLORS.dadoDois, icon: 'sale' },

    {
      key: 'tempo-sites',
      label: 'Tempo em sites',
      value: formatDailyDuration(dailyUsageMinutes),
      subtitle: dailyUsageMinutes > 0 ? 'registrado hoje' : 'nenhum registro hoje',
      iconColor: COLORS.customButtonFundo,
      icon: 'clock-outline',
    },
  ];

  const renderOverview = () => {
    if (overviewLoading && !overviewData) return <LoadingState />;
    if (overviewError && !overviewData) return <ErrorState message={overviewError} onRetry={loadOverview} />;

    return (
      <ScrollView
        ref={overviewScrollRef}
        style={styles.pageScroll}
        contentContainerStyle={[styles.pageContent, { paddingBottom: tabBarHeight + 28 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={overviewLoading} onRefresh={handleRefresh} tintColor={COLORS.dadoDois} />}>
        <PeriodSelector value={selectedMonth} onPress={() => setMonthPickerOpen(true)} label="Mês analisado" />

        <View onLayout={mark('financial')} style={styles.financialSummaryCard}>
          <View style={styles.financialSummaryHeader}>
            <View>
              <Text style={styles.financialSummaryEyebrow}>Resumo financeiro</Text>
              <Text style={styles.financialSummaryLabel}>Gastos do mês</Text>
            </View>
            {isHistoricalMonth ? <Text style={styles.financialSummaryContext}>Configuração atual</Text> : null}
          </View>
          <Text style={styles.financialSummaryValue}>
            {formatCents(totalCents)} <Text style={styles.financialSummaryValueSuffix}>gastos</Text>
          </Text>

          {metaCents > 0 ? (
            <View style={styles.financialBars}>
              <View style={styles.financialBarRow}>
                <View style={styles.financialComparisonRows}>
                  <View style={styles.financialBarHeader}>
                    <Text style={styles.financialBarLabel}>Limite mensal</Text>
                    <Text style={styles.financialBarValue}>{formatReais(metaValue)}</Text>
                  </View>
                  <View style={[styles.financialBarHeader, styles.financialBarHeaderEnd]}>
                    <Text style={styles.financialBarLabel}>Gastos do mês</Text>
                    <Text style={styles.financialBarValue}>{formatCents(totalCents)}</Text>
                  </View>
                </View>
                <View style={styles.financialBarTrack}>
                  <View style={[styles.financialBarFill, { width: `${spentWithinLimitWidth}%` }]} />
                  {spentExcessWidth > 0 ? <View style={[styles.financialBarFillExcess, { left: `${spentWithinLimitWidth}%`, width: `${spentExcessWidth}%` }]} /> : null}
                  <View style={[styles.financialBarLimitMarker, { left: `${Math.min(limitWidth, 98)}%` }]} />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noLimitState}>
              <Text style={styles.noLimitTitle}>Limite mensal não configurado</Text>
              <Text style={styles.noLimitText}>O gasto é exibido sem comparação ou percentual de limite.</Text>
            </View>
          )}

          <View style={styles.financialSummaryStatus}>
            {usagePercentValue ? (
              <View style={styles.financialSummaryPercentBlock}>
                <Text style={[styles.financialSummaryPercentValue, { color: metaStatusColor }]}>{usagePercentValue}</Text>
                <Text style={styles.financialSummaryPercentLabel}>do limite utilizado</Text>
              </View>
            ) : null}
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

        <View onLayout={mark('rf018')}>
          <AnaliseComportamento
            dados={comportamento.dados}
            loading={comportamento.loading}
            error={comportamento.error}
            onRetry={comportamento.refresh}
          />
        </View>

        <View onLayout={mark('categories')}>
          <Categoria gastosCategoria={period?.categorias || []} />
        </View>
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
        <View onLayout={mark('tempo')}>
          <TempoApp tempoUso={tempoUso} title="Tempo de uso · Hoje" />
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
