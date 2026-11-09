import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import AppEmptyState from '../../Common/AppEmptyState';
import { styles } from './styles';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';
import { distribuicaoClassificacoes } from '../../../utils/distribuicaoClassificacoes';
import { corPorProporcao } from '../../../utils/meiaLuaHome';

const RING_SIZE = 136;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function Impulsividade({
  data,
  onSelect,
  impulsividade = [],
  title = 'Classificações registradas',
  emptyMessage = 'Nenhuma classificação disponível.',
  classificationKey = 'compra_classificacao',
  classificationValue = 'IMPULSIVA',
  totalKey = null,
  centerLabel = 'marcadas como impulsivas',
  centerValueMode = 'percentage',
  observedPurchaseCount = null,
} = {}) {
  const sourceData = data ?? impulsividade;
  const isArrayData = Array.isArray(sourceData);
  const isObjectData = !isArrayData && sourceData !== null && typeof sourceData === 'object';
  const isEmptyArray = isArrayData && sourceData.length === 0;
  const isEmptyObject = isObjectData && Object.keys(sourceData).length === 0;

  if ((!isArrayData && !isObjectData) || isEmptyArray || isEmptyObject) {
    return (
      <View style={styles.section}>
        <ProfileCard title={title} variant="dashboard">
          <AppEmptyState icon="clipboard-text-outline" title={emptyMessage} compact />
        </ProfileCard>
      </View>
    );
  }

  if (isArrayData) {
    const distribution = distribuicaoClassificacoes(sourceData);
    const groups = distribution.groups.filter((group) => group.quantidade > 0);
    if (distribution.total === 0) {
      return (
        <View style={styles.section}>
          <ProfileCard title={title} variant="dashboard">
            <AppEmptyState icon="clipboard-text-outline" title={emptyMessage} compact />
          </ProfileCard>
        </View>
      );
    }

    let currentOffset = 0;
    const segments = groups.map((group) => {
      const segmentLength = (group.percentual / 100) * RING_CIRCUMFERENCE;
      const offset = currentOffset;
      currentOffset += segmentLength;
      return { ...group, strokeDashoffset: RING_CIRCUMFERENCE - segmentLength, offsetPosition: offset };
    });

    return (
      <View style={styles.section}>
        <ProfileCard title={title} variant="dashboard">
          <View style={styles.distributionLayout}>
            <View
              style={styles.distributionChart}
              accessible
              accessibilityRole="image"
              accessibilityLabel={`${distribution.total} compras confirmadas neste período`}
            >
              <Svg width={RING_SIZE} height={RING_SIZE} style={styles.distributionSvg}>
                <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke={DASHBOARD_THEME.colors.track} strokeWidth={RING_STROKE} fill="transparent" />
                {segments.map((segment) => (
                  <Circle
                    key={segment.codigo}
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={segment.cor}
                    strokeWidth={RING_STROKE}
                    fill="transparent"
                    strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                    strokeDashoffset={segment.strokeDashoffset}
                    strokeLinecap="butt"
                    rotation={-90 + (360 * segment.offsetPosition) / RING_CIRCUMFERENCE}
                    origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                  />
                ))}
              </Svg>
              <View style={styles.distributionCenter}>
                <Text style={styles.distributionTotal}>{distribution.total}</Text>
                <Text style={styles.distributionTotalLabel}>confirmadas</Text>
              </View>
            </View>

            <View style={styles.distributionLegend}>
              {groups.map((group) => (
                <Pressable
                  key={group.codigo}
                  accessibilityRole="button"
                  disabled={!onSelect}
                  accessibilityLabel={`${group.nome}: ${group.quantidade} compras, ${group.percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
                  onPress={() => onSelect?.(group.codigo)}
                  style={styles.distributionLegendItem}
                >
                  <View style={styles.distributionLegendHeader}>
                    <Text style={styles.distributionLegendLabel} numberOfLines={1}>{group.nome}</Text>
                    <Text style={styles.distributionLegendValue}>{group.quantidade} · {group.percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</Text>
                  </View>
                  <View style={styles.distributionLegendTrack}>
                    <View style={[styles.distributionLegendFill, { width: `${group.percentual}%`, backgroundColor: group.cor }]} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </ProfileCard>
      </View>
    );
  }

  if (isObjectData && totalKey === 'acima_limite') {
    const above = sourceData.acima_limite;
    const within = sourceData.dentro_limite;
    const valid = [above, within].every((value) => Number.isSafeInteger(value) && value >= 0);
    const total = valid ? above + within : 0;

    if (!valid || total === 0) {
      const hasObservedPurchases = Number.isSafeInteger(observedPurchaseCount) && observedPurchaseCount > 0;
      return (
        <View style={styles.section}>
          <ProfileCard title={title} variant="dashboard">
            <AppEmptyState
              icon="clipboard-text-outline"
              title={hasObservedPurchases || !valid ? 'Dados insuficientes para calcular este indicador.' : emptyMessage}
              compact
            />
          </ProfileCard>
        </View>
      );
    }

    const progress = (above / total) * 100;
    const progressOffset = RING_CIRCUMFERENCE - (progress / 100) * RING_CIRCUMFERENCE;
    const limitColor = corPorProporcao(above, total, 'RISCO');
    return (
      <View style={styles.section}>
        <ProfileCard title={title} variant="dashboard">
          <View style={styles.heroCard}>
            <View style={styles.ringWrap}>
              <View style={styles.ringShell} accessible accessibilityRole="image" accessibilityLabel={`${above} compras acima do limite neste período`}>
                <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg}>
                  <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke="#EAE3F7" strokeWidth={RING_STROKE} fill="transparent" />
                  <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke={limitColor} strokeWidth={RING_STROKE} fill="transparent" strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`} strokeDashoffset={progressOffset} strokeLinecap="round" rotation="-90" origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`} />
                </Svg>
                <View style={styles.ringCenter}>
                  <Text style={[styles.chartPercent, { color: limitColor }]}>{above}</Text>
                  <Text style={styles.chartCenterLabel}>{centerLabel}</Text>
                </View>
              </View>
            </View>
            <View style={styles.limitContext}>
              <View style={styles.limitContextHeader}>
                <Text style={styles.limitContextTitle}>Distribuição do período</Text>
                <Text style={styles.limitContextTotal}>{total} compras</Text>
              </View>
              <View style={styles.limitContextTrack}><View style={[styles.limitContextFill, { width: `${progress}%`, backgroundColor: limitColor }]} /></View>
              <View style={styles.limitContextLabels}>
                <Text style={styles.limitContextLabel}>{above} acima do limite</Text>
                <Text style={styles.limitContextLabel}>{within} dentro do limite</Text>
              </View>
            </View>
          </View>
        </ProfileCard>
      </View>
    );
  }

  const totalQuantity = Object.values(sourceData).reduce((sum, value) => sum + Number(value || 0), 0);
  if (totalQuantity === 0) {
    return (
      <View style={styles.section}>
        <ProfileCard title={title} variant="dashboard">
          <AppEmptyState icon="clipboard-text-outline" title={emptyMessage} compact />
        </ProfileCard>
      </View>
    );
  }

  const relevantQuantity = Number(sourceData?.[totalKey || 'acima_limite'] ?? 0) || 0;
  const impulsivePercentage = totalQuantity > 0 ? Math.round((relevantQuantity / totalQuantity) * 100) : 0;
  const progress = Math.max(0, Math.min(100, impulsivePercentage));
  const progressOffset = RING_CIRCUMFERENCE - (progress / 100) * RING_CIRCUMFERENCE;
  const withinLimitQuantity = Math.max(0, totalQuantity - relevantQuantity);
  const centerValue = centerValueMode === 'quantity' ? relevantQuantity : `${progress}%`;
  const indicatorColor = corPorProporcao(relevantQuantity, totalQuantity, 'RISCO');

  return (
    <View style={styles.section}>
      <ProfileCard title={title} variant="dashboard">
        <View style={styles.heroCard}>
          <View style={styles.ringWrap}>
            <View style={styles.ringShell} accessible accessibilityRole="image" accessibilityLabel={`${relevantQuantity} compras acima do limite neste período`}>
              <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg}>
                <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke="#EAE3F7" strokeWidth={RING_STROKE} fill="transparent" />
                <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke={indicatorColor} strokeWidth={RING_STROKE} fill="transparent" strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`} strokeDashoffset={progressOffset} strokeLinecap="round" rotation="-90" origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`} />
              </Svg>
              <View style={styles.ringCenter}>
                <Text style={[styles.chartPercent, { color: indicatorColor }]}>{centerValue}</Text>
                <Text style={styles.chartCenterLabel}>{centerLabel}</Text>
              </View>
            </View>
          </View>
          <View style={styles.limitContext}>
            <View style={styles.limitContextHeader}>
              <Text style={styles.limitContextTitle}>Distribuição do período</Text>
              <Text style={styles.limitContextTotal}>{totalQuantity} compras</Text>
            </View>
            <View style={styles.limitContextTrack}><View style={[styles.limitContextFill, { width: `${progress}%`, backgroundColor: indicatorColor }]} /></View>
            <View style={styles.limitContextLabels}>
              <Text style={styles.limitContextLabel}>{relevantQuantity} acima do limite</Text>
              <Text style={styles.limitContextLabel}>{withinLimitQuantity} dentro do limite</Text>
            </View>
          </View>
        </View>
      </ProfileCard>
    </View>
  );
}
