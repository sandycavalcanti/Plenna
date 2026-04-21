import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

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
    <View style={{ backgroundColor: '#fff' }}>
      <View style={styles.card}>
        <Text style={styles.title}>Gastos Totais</Text>

        <Text style={styles.valor}>R$ 1.250,78</Text>
        <Text style={styles.meta}>
          Meta: <Text style={{ color: '#6E63B5' }}>R$800,00</Text>
        </Text>

        <Text style={styles.excedente}>+{porcentagem}% acima da meta</Text>

        <View style={{ backgroundColor: '#AAA4A4', borderRadius: 16, padding: 10 }}>
          <BarChart horizontal data={data} noOfSections={3} barBorderRadius={100} yAxisThickness={0} xAxisThickness={0} labelsDistanceFromXaxis={15} endSpacing={0} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 20,
    padding: 20,
    paddingBottom: 0,
    backgroundColor: '#ECECEC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6B6B8F',
  },

  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#222',
  },

  valor: {
    fontSize: 36,
    color: '#C02C7A',
    marginTop: 10,
    fontWeight: '600',
  },

  meta: {
    fontSize: 18,
    marginTop: 8,
  },

  excedente: {
    color: '#C40000',
    fontSize: 18,
    marginTop: 4,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 20,
  },
});
