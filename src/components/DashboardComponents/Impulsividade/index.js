import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import { styles } from './styles';
import { COLORS } from '../../../constants';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';
import { distribuicaoClassificacoes } from '../../../utils/distribuicaoClassificacoes';

const RING_SIZE = 136;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function Impulsividade({
  data,
  impulsividade = [],
  title = 'Classificações registradas',
  emptyMessage = 'Nenhuma compra confirmada registrada neste período',
  classificationKey = 'compra_classificacao',
  classificationValue = 'IMPULSIVA',
  totalKey = null,
  centerLabel = 'marcadas como impulsivas',
  centerValueMode = 'percentage',
} = {}) {
  const sourceData = data ?? impulsividade;
  const isArrayData = Array.isArray(sourceData);
  const isObjectData = !isArrayData && sourceData !== null && typeof sourceData === 'object';
  const isEmptyArray = isArrayData && sourceData.length === 0;
  const isEmptyObject = isObjectData && Object.keys(sourceData).length === 0;

  // Se não houver dados, retorna mensagem
  if ((!isArrayData && !isObjectData) || isEmptyArray || isEmptyObject) {
    return (
      <View style={styles.section}>
        <ProfileCard title={title} variant="dashboard">
          <Text style={styles.emptyMessage}>{emptyMessage}</Text>
        </ProfileCard>
      </View>
    );
  }


  if(isArrayData) {
    const distribution=distribuicaoClassificacoes(sourceData);
    let currentOffset = 0;
    const segments = distribution.groups
      .filter((group) => group.quantidade > 0)
      .map((group) => {
        const segmentLength = (group.percentual / 100) * RING_CIRCUMFERENCE;
        const offset = currentOffset;
        currentOffset += segmentLength;
        return {
          ...group,
          strokeDashoffset: RING_CIRCUMFERENCE - segmentLength,
          offsetPosition: offset,
        };
      });

    return (
      <View style={styles.section}>
        <ProfileCard title={title} variant="dashboard">
          {distribution.total === 0 ? (
            <Text style={styles.emptyMessage}>{emptyMessage}</Text>
          ) : (
            <View style={styles.distributionLayout}>
              <View
                style={styles.distributionChart}
                accessible
                accessibilityRole="image"
                accessibilityLabel={`${distribution.total} compras confirmadas neste período`}
              >
                <Svg width={RING_SIZE} height={RING_SIZE} style={styles.distributionSvg}>
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={DASHBOARD_THEME.colors.track}
                    strokeWidth={RING_STROKE}
                    fill="transparent"
                  />
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
                {distribution.groups.map((group) => (
                  <View key={group.codigo} style={styles.distributionLegendItem}>
                    <View style={styles.distributionLegendHeader}>
                      <Text style={styles.distributionLegendLabel} numberOfLines={1}>
                        {group.nome}
                      </Text>
                      <Text style={styles.distributionLegendValue}>
                        {group.quantidade} · {group.percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                      </Text>
                    </View>
                    <View style={styles.distributionLegendTrack}>
                      <View style={[styles.distributionLegendFill, { width: `${group.percentual}%`, backgroundColor: group.cor }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ProfileCard>
      </View>
    );
  }

  // Normaliza tanto listas quanto objetos resumidos vindos da API
  const totalQuantity = isArrayData ? sourceData.reduce((sum, item) => sum + Number(item?.quantidade || 0), 0) : Object.values(sourceData).reduce((sum, value) => sum + Number(value || 0), 0);

  const relevantQuantity = isArrayData
    ? sourceData.find((item) => String(item?.[classificationKey] || '').toUpperCase() === String(classificationValue).toUpperCase())?.quantidade || 0
    : Number(sourceData?.[totalKey || 'acima_limite'] ?? 0) || 0;

  const impulsivePercentage = totalQuantity > 0 ? Math.round((relevantQuantity / totalQuantity) * 100) : 0;
  const progress = Math.max(0, Math.min(100, impulsivePercentage));
  const progressOffset = RING_CIRCUMFERENCE - (progress / 100) * RING_CIRCUMFERENCE;
  const withinLimitQuantity = Math.max(0, totalQuantity - relevantQuantity);

  const centerValue = centerValueMode === 'quantity' ? relevantQuantity : `${progress}%`;

  return (
    <View style={styles.section}>
      <ProfileCard title={title} variant="dashboard">
        <View style={styles.heroCard}>
          <View style={styles.ringWrap}>
            <View
              style={styles.ringShell}
              accessible
              accessibilityRole="image"
              accessibilityLabel={`${relevantQuantity} compras acima do limite neste período`}
            >
              <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg}>
                <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke="#EAE3F7" strokeWidth={RING_STROKE} fill="transparent" />
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={COLORS.dadoDois}
                  strokeWidth={RING_STROKE}
                  fill="transparent"
                  strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />
              </Svg>

              <View style={styles.ringCenter}>
                <Text style={styles.chartPercent}>{centerValue}</Text>
                <Text style={styles.chartCenterLabel}>{centerLabel}</Text>
              </View>
            </View>
          </View>
          <View style={styles.limitContext}>
            <View style={styles.limitContextHeader}>
              <Text style={styles.limitContextTitle}>Distribuição do período</Text>
              <Text style={styles.limitContextTotal}>{totalQuantity} compras</Text>
            </View>
            <View style={styles.limitContextTrack}>
              <View style={[styles.limitContextFill, { width: `${progress}%` }]} />
            </View>
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
