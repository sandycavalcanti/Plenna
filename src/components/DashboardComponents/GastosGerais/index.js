import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import ProfileCard from '../../ProfileComponents/ProfileCard';

export default function GastosTotais() {
  const gasto = 1250.78;
  const meta = 800;
  const porcentagem = Math.round((gasto / meta - 1) * 100);

  const data = [
    {
      value: meta,
      label: 'Meta',
      frontColor: '#626784',
    },
    {
      value: gasto,
      label: 'Gasto',
      frontColor: '#C79AB0',
    },
  ];

  return (
    <View style={styles.section}>
      <ProfileCard title="Gastos Totais">
        <Text style={styles.valor}>R$ 1.250,78</Text>
        <Text style={styles.meta}>
          Meta: <Text style={{ color: '#6E63B5' }}>R$800,00</Text>
        </Text>

        <Text style={styles.excedente}>+{porcentagem}% acima da meta</Text>

        <View style={styles.chartContainer}>
          <BarChart horizontal data={data} noOfSections={3} barBorderRadius={100} yAxisThickness={0} xAxisThickness={0} labelsDistanceFromXaxis={15} endSpacing={0} />
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

  valor: {
    fontSize: 36,
    color: '#C02C7A',
    fontWeight: '600',
  },

  meta: {
    fontSize: 18,
  },

  excedente: {
    color: '#C40000',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 20,
  },

  chartContainer: {
    borderRadius: 16,
    padding: 10,
    marginTop: -60,
    marginBottom: -60,
  },
});
