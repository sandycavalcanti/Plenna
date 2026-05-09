import React from 'react';
import { View, Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import { styles } from './styles';
import { COLORS } from '../../../constants';

export default function GastosTotais() {
  const gasto = 1250.78;
  const meta = 800;
  const porcentagem = Math.round((gasto / meta - 1) * 100);

  const data = [
    {
      value: meta,
      label: 'Meta',
      frontColor: COLORS.dadoUm,
    },
    {
      value: gasto,
      label: 'Gasto',
      frontColor: COLORS.dadoDois,
    },
  ];

  return (
    <View style={styles.section}>
      <ProfileCard title="Gastos Totais">
        <Text style={styles.valor}>R$ 1.250,78</Text>
        <Text style={styles.meta}>
          Meta: <Text style={styles.metaValor}>R$800,00</Text>
        </Text>

        <Text style={styles.excedente}>+{porcentagem}% acima da meta</Text>

        <View style={styles.chartContainer}>
          <BarChart horizontal data={data} noOfSections={3} barBorderRadius={100} yAxisThickness={0} xAxisThickness={0} labelsDistanceFromXaxis={15} endSpacing={0} />
        </View>
      </ProfileCard>
    </View>
  );
}
