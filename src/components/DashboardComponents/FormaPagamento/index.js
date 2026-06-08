import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import { styles } from './styles';
import { COLORS } from '../../../constants';

const DONUT_SIZE = 160;
const DONUT_STROKE = 32;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizePaymentData(gastosFormaPagamento = []) {
  if (!Array.isArray(gastosFormaPagamento)) {
    return [];
  }

  return gastosFormaPagamento
    .map((item) => ({
      label: item?.forma_pagamento_nome || 'Desconhecido',
      value: Number(item?.total || 0),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

export default function FormaPagamento({ gastosFormaPagamento = [] }) {
  const [expanded, setExpanded] = useState(false);
  const items = normalizePaymentData(gastosFormaPagamento);
  const total = items.reduce((acc, item) => acc + item.value, 0);

  const colors = [COLORS.dadoDois, COLORS.dadoTres, COLORS.dadoUm, COLORS.customButtonFundo];

  const dominantMethod = items[0];

  if (items.length === 0) {
    return (
      <View style={styles.section}>
        <ProfileCard title="Gastos por forma de pagamento">
          <Text style={styles.emptyMessage}>Nenhum gasto por forma de pagamento disponível</Text>
        </ProfileCard>
      </View>
    );
  }

  // Calculate segment offsets for donut
  let currentOffset = 0;
  const segments = items.map((item, index) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const segmentLength = (percentage / 100) * DONUT_CIRCUMFERENCE;
    const offset = currentOffset;
    currentOffset += segmentLength;

    return {
      ...item,
      percentage,
      color: colors[index % colors.length],
      strokeDashoffset: DONUT_CIRCUMFERENCE - segmentLength,
      offsetPosition: offset,
    };
  });

  const displayedItems = expanded ? items : items.slice(0, 3);

  return (
    <View style={styles.section}>
      <ProfileCard title="Gastos por forma de pagamento">
        <View style={styles.summaryCard}>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryLabel}>Maior participação</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {dominantMethod?.label}
            </Text>
            <Text style={styles.summaryCaption}>R${formatCurrency(dominantMethod?.value)}</Text>
          </View>

          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeValue}>R$ {formatCurrency(total)}</Text>
            <Text style={styles.summaryBadgeText}>total distribuído</Text>
          </View>
        </View>

        <View style={styles.chartWrapper}>
          <Svg width={DONUT_SIZE} height={DONUT_SIZE} style={styles.donutSvg}>
            {segments.map((segment, index) => (
              <Circle
                key={segment.label}
                cx={DONUT_SIZE / 2}
                cy={DONUT_SIZE / 2}
                r={DONUT_RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth={DONUT_STROKE}
                strokeDasharray={DONUT_CIRCUMFERENCE}
                strokeDashoffset={segment.strokeDashoffset}
                rotation={-90 + (360 * segment.offsetPosition) / DONUT_CIRCUMFERENCE}
                originX={DONUT_SIZE / 2}
                originY={DONUT_SIZE / 2}
              />
            ))}
          </Svg>
        </View>

        {expanded && (
          <View style={styles.detailsSection}>
            <View style={styles.legendList}>
              {items.map((item, index) => {
                const color = colors[index % colors.length];
                const share = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={styles.legendTopRow}>
                      <View style={styles.legendLabelRow}>
                        <View style={[styles.legendDot, { backgroundColor: color }]} />
                        <Text style={styles.legendLabel} numberOfLines={1}>
                          {item.label}
                        </Text>
                      </View>
                      <Text style={styles.legendValue}>R$ {formatCurrency(item.value)}</Text>
                    </View>
                    <View style={styles.legendTrack}>
                      <View style={[styles.legendFill, { width: `${share}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={styles.legendPercent}>{share}% do total</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
          <Text style={styles.expandButtonText}>{expanded ? 'Recolher' : `Ver mais (${items.length})`}</Text>
          <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.dadoDois} />
        </TouchableOpacity>
      </ProfileCard>
    </View>
  );
}
