import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import { styles } from './styles';
import { COLORS } from '../../../constants';

function formatMinutes(totalMinutes) {
  const minutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export default function TempoApp({ tempoUso = [], title = 'Tempo em sites de compra' }) {
  const [expanded, setExpanded] = useState(false);
  const barAnim = useRef(new Animated.Value(0)).current;
  const agregado = tempoUso.reduce((acc, item) => {
    const nome = item.tempo_uso_nome || 'Desconhecido';
    const minutos = Number(item.tempo_uso_minutos ?? 0);
    acc[nome] = (acc[nome] || 0) + minutos;
    return acc;
  }, {});

  const items = Object.entries(agregado)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const totalMinutes = items.reduce((acc, item) => acc + item.value, 0);
  const topItem = items[0];
  const displayedItems = expanded ? items : items.slice(0, 3);
  const maxValue = Math.max(...displayedItems.map((item) => item.value), 1);

  const colors = [COLORS.dadoDois, COLORS.dadoTres, COLORS.dadoUm, COLORS.customButtonFundo];

  const getItemColor = (index) => colors[index % colors.length];
    useEffect(() => {
      barAnim.setValue(0);

      Animated.timing(barAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, [items.length]);
  if (items.length === 0) {

    return (
      <View style={styles.section}>
        <ProfileCard title={title}>
          <Text style={styles.emptyMessage}>Nenhum dado de tempo disponível</Text>
        </ProfileCard>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <ProfileCard title={title}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryLabel}>Maior tempo registrado</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {topItem?.label || 'Sem dados'}
            </Text>
          </View>

          <View style={styles.summaryBadge}>
            <MaterialCommunityIcons name="clock-outline" size={22} color={COLORS.dashboardBoxMaiorTempoBorda} />
            <Text style={styles.summaryBadgeText}>{formatMinutes(totalMinutes)}</Text>
          </View>
        </View>

        <View style={styles.rankList}>
          {displayedItems.map((item, index) => {
            const color = getItemColor(index);
            const share = totalMinutes > 0 ? Math.round((item.value / totalMinutes) * 100) : 0;

            return (
              <View key={`${item.label}-${index}`} style={styles.rankItem}>
                <View style={[styles.rankPosition, { backgroundColor: `${color}18` }]}>
                  <Text style={[styles.rankPositionText, { color }]}>{index + 1}</Text>
                </View>

                <View style={styles.rankContent}>
                  <View style={styles.rankTopRow}>
                    <Text style={styles.rankLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text style={styles.rankValue}>{formatMinutes(item.value)}</Text>
                  </View>

                  <View style={styles.rankTrack}>
                    <Animated.View
                      style={[
                        styles.rankFill,
                        {
                          width: `${(item.value / maxValue) * 100}%`,
                          backgroundColor: color,
                          transform: [
                            {
                              scaleX: barAnim,
                            },
                          ],
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.rankShare}>{share}% do total</Text>
                </View>
              </View>
            );
          })}
        </View>

        {items.length > 3 && (
          <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded(!expanded)}>
            <Text style={styles.expandButtonText}>{expanded ? 'Recolher' : `Ver mais (${items.length - 3})`}</Text>
            <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.dadoDois} />
          </TouchableOpacity>
        )}
      </ProfileCard>
    </View>
  );
}
