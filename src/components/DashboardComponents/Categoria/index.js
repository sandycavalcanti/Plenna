import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import { styles } from './styles';
import { COLORS } from '../../../constants';

export default function Categoria({ itens = [] }) {
  const palette = [COLORS.dadoDois, COLORS.dadoTres, COLORS.dadoUm];

  const map = new Map();
  let total = 0;

  itens.forEach((it) => {
    if (!it) return;
    const nome = it.tb_categoria?.categoria_nome ?? `Categoria ${it.categoria_id}`;
    const valor = Number(it.compra_item_valor ?? it.compra_item_valor) || 0;
    total += valor;
    map.set(nome, (map.get(nome) || 0) + valor);
  });

  const categories = Array.from(map.entries())
    .map(([label, value], idx) => ({ label, value, color: palette[idx % palette.length] }))
    .sort((a, b) => b.value - a.value);

  const pieData = categories.length ? categories.map((c) => ({ value: c.value, color: c.color, text: `${Math.round((c.value / total) * 100)}%` })) : [{ value: 1, color: '#ECECEC', text: '0%' }];

  const LegendItem = ({ color, label }) => (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.section}>
      <ProfileCard title="Categoria de gastos">
        <View style={styles.content}>
          <PieChart donut data={pieData} radius={70} innerRadius={40} showText={false} strokeWidth={0} />

          <View style={{ marginLeft: 20 }}>
            {categories.map((c) => (
              <LegendItem key={c.label} color={c.color} label={`${c.label} (${((c.value / total) * 100).toFixed(1)}%)`} />
            ))}
          </View>
        </View>
      </ProfileCard>
    </View>
  );
}
