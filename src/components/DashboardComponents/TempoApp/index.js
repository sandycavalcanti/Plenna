import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

export default function TempoApp() {
  const barData = [
    {
      value: 65,
      label: 'Shein',
      frontColor: '#5A627F',
    },
    {
      value: 30,
      label: 'Shopee',
      frontColor: '#7C86A8',
    },
    {
      value: 15,
      label: 'Mercado Livre',
      frontColor: '#B0B7D6',
    },
  ];

  return (
    <View style={{ backgroundColor: '#fff' }}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tempo em sites (em minutos)</Text>
        </View>
        <View style={{ marginTop: -30 }}>
          <BarChart horizontal data={barData} noOfSections={4} barBorderRadius={100} yAxisThickness={0} xAxisThickness={0} labelsDistanceFromXaxis={20} />
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
    marginBottom: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
  },

  menu: {
    fontSize: 22,
    color: '#444',
  },
});
