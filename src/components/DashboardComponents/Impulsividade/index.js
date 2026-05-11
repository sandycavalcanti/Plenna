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

function normalizePurchases(compra = [], compras = []) {
  if (Array.isArray(compra) && compra.length > 0) {
    return compra;
  }

  if (Array.isArray(compras) && compras.length > 0) {
    return compras;
  }

  return [];
}

export default function Impulsividade({ compra = [], compras = [] }) {
  const [expanded, setExpanded] = useState(false);
  const purchases = normalizePurchases(compra, compras);
  const totalPurchases = purchases.length;
  const impulsivePurchases = purchases.filter((item) => String(item?.compra_classificacao || '').toUpperCase() === 'IMPULSIVA').length;

  const impulsivePercentage = totalPurchases > 0 ? Math.round((impulsivePurchases / totalPurchases) * 100) : 0;
  const progress = Math.max(0, Math.min(100, impulsivePercentage));
  const progressOffset = RING_CIRCUMFERENCE - (progress / 100) * RING_CIRCUMFERENCE;

  const statusLabel = progress >= 50 ? 'Impulsividade alta' : progress >= 25 ? 'Impulsividade moderada' : 'Impulsividade baixa';

  const statusDescription =
    progress >= 50
      ? 'O comportamento de compra está mais concentrado em decisões impulsivas.'
      : progress >= 25
        ? 'Existe um nível intermediário de compras impulsivas no período.'
        : 'A maior parte das compras está fora do padrão impulsivo.';

  if (totalPurchases === 0) {
    return (
      <View style={styles.section}>
        <ProfileCard title="Compras impulsivas">
          <Text style={styles.emptyMessage}>Nenhuma compra disponível para análise</Text>
        </ProfileCard>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <ProfileCard title="Compras impulsivas">
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
                <Text style={styles.chartPercent}>{impulsivePercentage}%</Text>
                <Text style={styles.chartCenterLabel}>impulsivas</Text>
              </View>
            </View>
          </View>

          {expanded && (
            <View style={styles.infoBlock}>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusPillText}>{statusLabel}</Text>
              </View>

              <Text style={styles.infoTitle}>Taxa de impulsividade</Text>
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
