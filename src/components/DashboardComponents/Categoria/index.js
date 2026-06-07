import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './styles';
import { COLORS } from '../../../constants';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import { formatarValorMonetarioParaTela } from '../../CustomTextInput/currency';

const screenWidth = Dimensions.get('window').width;

export default function Categoria({ gastosCategoria = [] }) {
  const [expanded, setExpanded] = useState(false);
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

  const displayedCategories = expanded ? categories : categories.slice(0, 2);

  const iconMap = {
    roupa: 'hanger',
    eletrônicos: 'laptop',
    gadgets: 'gamepad-variant',
    hobbies: 'palette',
    lazer: 'gamepad-variant',
    alimentação: 'silverware-fork-knife',
    transporte: 'car',
    moradia: 'home',
    saúde: 'hospital-box',
    educação: 'school',
  };

  const getIconForCategory = (categoryName) => {
    const lower = categoryName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lower.includes(key)) return icon;
    }
    return 'tag';
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
        <Text style={styles.emptyMessage}>Nenhuma categoria encontrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <ProfileCard title="Gastos por categoria">
        <View style={styles.displayedCategories}>
          {displayedCategories.map((cat) => {
            const percent = total > 0 ? ((cat.value / total) * 100).toFixed(1) : 0;
            return <CategoryCard key={cat.label} cat={cat} percent={percent} />;
          })}
        </View>

        {categories.length > 2 && (
          <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded(!expanded)}>
            <Text style={styles.expandButtonText}>{expanded ? 'Recolher' : `Ver mais (${categories.length - 2})`}</Text>
            <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.dadoDois} />
          </TouchableOpacity>
        )}
      </ProfileCard>
    </View>
  );
}
