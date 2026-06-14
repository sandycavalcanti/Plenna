import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './styles';
import { COLORS } from '../../../constants';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import { formatarValorMonetarioParaTela } from '../../CustomTextInput/currency';

export default function Categoria({ gastosCategoria = [] }) {
  const [expanded, setExpanded] = useState(false);
  const chartAnim = useRef(new Animated.Value(0)).current;
  const palette = [COLORS.dadoDois, COLORS.dadoTres, COLORS.dadoUm, COLORS.customButtonFundo, COLORS.limitSliderThumb];

  const total = gastosCategoria.reduce((sum, gasto) => {
    if (!gasto || !gasto.total) return sum;
    return sum + Number(gasto.total);
  }, 0);

  const categories = gastosCategoria
    .filter((gasto) => gasto && gasto.categoria_nome)
    .map((gasto, idx) => ({
      label: gasto.categoria_nome,
      value: Number(gasto.total) || 0,
      color: palette[idx % palette.length],
    }));

  const displayedCategories = expanded ? categories : [];
  const chartCategories = categories.slice(0, 4);
  const chartMax = Math.max(...chartCategories.map((cat) => cat.value), 1);
  const topCategory = chartCategories[0];
  const topPercent = total > 0 && topCategory ? ((topCategory.value / total) * 100).toFixed(1) : 0;
  const chartKey = useMemo(() => chartCategories.map((cat) => `${cat.label}:${cat.value}`).join('|'), [chartCategories]);

  useEffect(() => {
    chartAnim.setValue(0);
    Animated.timing(chartAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [chartAnim, chartKey]);

  const iconMap = {
    moradia: 'home',
    'contas e serviços': 'lightning-bolt',
    transporte: 'car',
    saúde: 'heart-pulse',
    educação: 'school',
    'restaurantes e delivery': 'silverware-fork-knife',
    pets: 'paw',
    'assinaturas e serviços digitais': 'monitor-dashboard',
    'roupas e calçados': 'hanger',
    'beleza e cosméticos': 'lipstick',
    'eletrônicos e gadgets': 'laptop',
    'hobbies e lazer': 'gamepad-variant',
    presentes: 'gift',
    outros: 'dots-horizontal',
  };

  const getIconForCategory = (categoryName) => {
    return iconMap[categoryName.toLowerCase()] || 'tag';
  };

  const CategoryCard = ({ cat, percent }) => (
    <View style={[styles.categoryCard, { borderLeftColor: cat.color }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${cat.color}20` }]}>
        <MaterialCommunityIcons name={getIconForCategory(cat.label)} size={20} color={cat.color} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.categoryLabel}>{cat.label}</Text>
          <Text style={styles.categoryPercent}>{percent}%</Text>
        </View>
        <Text style={styles.categoryValue}>{formatarValorMonetarioParaTela(cat.value) || 'R$ 0,00'}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: cat.color, width: `${percent}%` }]} />
        </View>
      </View>
    </View>
  );

  if (categories.length === 0) {
    return (
      <View style={styles.section}>
        <ProfileCard title="Gastos por categoria">
          <Text style={styles.emptyMessage}>Nenhuma categoria encontrada</Text>
        </ProfileCard>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <ProfileCard title="Gastos por categoria">
        <View style={styles.summaryCard}>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryLabel}>Categoria principal</Text>

            <Text style={styles.summaryValue}>{topCategory.label}</Text>
          </View>

          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeValue}>{topPercent}%</Text>
          </View>
        </View>
        <View style={styles.chartCard}>
          <View style={styles.barChartWrap}>
            {chartCategories.map((cat) => {
              const isTop = cat.label === topCategory?.label;

              const targetHeight = Math.max((cat.value / chartMax) * 120, 8);

              return (
                <View
                  key={`bar-${cat.label}`}
                  style={[
                    styles.barItem,
                    isTop && {
                      transform: [{ scale: 1.08 }],
                    },
                  ]}>
                  {isTop && <MaterialCommunityIcons name="crown" size={16} color="#F4B400" style={{ marginBottom: 4 }} />}
                  <Text style={styles.barValue}>{((cat.value / total) * 100).toFixed(1)}%</Text>
                  <View style={styles.barTrack}>
                    <Animated.View
                      style={[
                        styles.barFill,
                        {
                          height: Animated.multiply(chartAnim, targetHeight),
                          backgroundColor: cat.color,
                          opacity: chartAnim,
                        },
                      ]}
                    />
                  </View>
                  <MaterialCommunityIcons name={getIconForCategory(cat.label)} size={22} color={cat.color} style={{ marginTop: 6 }} />
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.displayedCategories}>
          {displayedCategories.map((cat) => {
            const percent = total > 0 ? ((cat.value / total) * 100).toFixed(1) : 0;
            return <CategoryCard key={cat.label} cat={cat} percent={percent} />;
          })}
        </View>

        {categories.length >= 1 && (
          <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded(!expanded)}>
            <Text style={styles.expandButtonText}>{expanded ? 'Recolher' : `Ver mais (${categories.length})`}</Text>
            <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.dadoDois} />
          </TouchableOpacity>
        )}
      </ProfileCard>
    </View>
  );
}
