import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import ProfileCard from '../../ProfileComponents/ProfileCard';

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
    <View style={styles.section}>
      <ProfileCard title="Categoria de gastos">
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
      </ProfileCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginVertical: 10,
  },

  content: {
    width: '100%',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
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
