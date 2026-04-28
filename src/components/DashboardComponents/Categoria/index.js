import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import { styles } from './styles';
import { COLORS } from '../../../constants';

export default function Categoria() {
  const pieData = [
    { value: 62.5, color: COLORS.dadoDois, text: '62,5%' },
    { value: 25, color: COLORS.dadoTres, text: '25%' },
    { value: 12.5, color: COLORS.dadoUm, text: '12,5%' },
  ];

  const LegendItem = ({ color, label }) => (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.section}>
      <ProfileCard title="Categoria de gastos">
        {/* Conteúdo */}
        <View style={styles.content}>
          {/* Donut */}
          <PieChart data={pieData} donut radius={70} innerRadius={40} showText={false} strokeWidth={0} />

          {/* Legenda */}
          <View style={{ marginLeft: 20 }}>
            <LegendItem color={COLORS.dadoDois} label="Roupa (62,5%)" />
            <LegendItem color={COLORS.dadoTres} label="Casa (25%)" />
            <LegendItem color={COLORS.dadoUm} label="Livraria (12,5%)" />
          </View>
        </View>
      </ProfileCard>
    </View>
  );
}
