import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

export default function Categoria() {
  const pieData = [
    { value: 62.5, color: '#C79AB0', text: '62,5%' },
    { value: 25, color: '#8B95C9', text: '25%' },
    { value: 12.5, color: '#5A627F', text: '12,5%' },
  ];

  const LegendItem = ({ color, label }) => (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );

  return (
    <View style={{ backgroundColor: '#fff' }}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Categoria de gastos</Text>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>Total de itens: 28</Text>
          </View>
        </View>

        {/* Conteúdo */}
        <View style={styles.content}>
          {/* Donut */}
          <PieChart data={pieData} donut radius={70} innerRadius={40} showText={false} strokeWidth={0} />

          {/* Legenda */}
          <View style={{ marginLeft: 20 }}>
            <LegendItem color="#C79AB0" label="Roupa (62,5%)" />
            <LegendItem color="#8B95C9" label="Casa (25%)" />
            <LegendItem color="#5A627F" label="Livraria (12,5%)" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 20,
    padding: 16,
    backgroundColor: '#ECECEC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6B6B8F',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
  },

  badge: {
    backgroundColor: '#9C8CD6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },

  badgeText: {
    color: '#fff',
    fontWeight: '600',
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  legendText: {
    fontSize: 16,
    color: '#333',
  },
});
