import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import { styles } from './styles';
import { COLORS } from '../../../constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const RING_SIZE = 136;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function Impulsividade({
  data,
  impulsividade = [],
  title = 'Compras impulsivas',
  emptyMessage = 'Nenhuma compra disponível para análise',
  classificationKey = 'compra_classificacao',
  classificationValue = 'IMPULSIVA',
  totalKey = null,
  centerLabel = 'impulsivas',
  centerValueMode = 'percentage',
  infoTitle = 'Taxa de impulsividade',
  highLabel = 'Impulsividade alta',
  mediumLabel = 'Impulsividade moderada',
  lowLabel = 'Impulsividade baixa',
  highDescription = 'O comportamento de compra está mais concentrado em decisões impulsivas.',
  mediumDescription = 'Existe um nível intermediário de compras impulsivas no período.',
  lowDescription = 'A maior parte das compras está fora do padrão impulsivo.',
} = {}) {
  const [expanded, setExpanded] = useState(false);
  const sourceData = data ?? impulsividade;
  const isArrayData = Array.isArray(sourceData);
  const isObjectData = !isArrayData && sourceData !== null && typeof sourceData === 'object';
  const isEmptyArray = isArrayData && sourceData.length === 0;
  const isEmptyObject = isObjectData && Object.keys(sourceData).length === 0;

  // Se não houver dados, retorna mensagem
  if ((!isArrayData && !isObjectData) || isEmptyArray || isEmptyObject) {
    return (
      <View style={styles.section}>
        <ProfileCard title={title}>
          <Text style={styles.emptyMessage}>{emptyMessage}</Text>
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

  const statusLabel = progress >= 50 ? highLabel : progress >= 25 ? mediumLabel : lowLabel;

  const statusDescription = progress >= 50 ? highDescription : progress >= 25 ? mediumDescription : lowDescription;

  const centerValue = centerValueMode === 'quantity' ? relevantQuantity : `${progress}%`;

  return (
    <View style={styles.section}>
      <ProfileCard title={title}>
        <View style={styles.heroCard}>
          <View style={styles.ringWrap}>
            <View style={styles.ringShell}>
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

          {expanded && (
            <View style={styles.infoBlock}>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusPillText}>{statusLabel}</Text>
              </View>

              <Text style={styles.infoTitle}>{infoTitle}</Text>
              <Text style={styles.infoDescription}>{statusDescription}</Text>

              <View style={styles.meterTrack}>
                <View style={[styles.meterFill, { width: `${progress}%` }]} />
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded(!expanded)}>
            <Text style={styles.expandButtonText}>{expanded ? 'Recolher' : 'Ver mais'}</Text>
            <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.dadoDois} />
          </TouchableOpacity>
        </View>
      </ProfileCard>
    </View>
  );
}
