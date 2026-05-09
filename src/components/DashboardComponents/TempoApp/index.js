import React from 'react';
import { View, Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import { styles } from './styles';
import { COLORS } from '../../../constants';

export default function TempoApp({ tempoUso = [] }) {
  // Agrega minutos por nome do app
  const agregado = tempoUso.reduce((acc, item) => {
    const nome = item.tempo_uso_nome || item.tempo_uso_nome || 'Desconhecido';
    const minutos = Number(item.tempo_uso_minutos ?? 0);
    acc[nome] = (acc[nome] || 0) + minutos;
    return acc;
  }, {});

  const items = Object.entries(agregado).map(([label, value]) => ({ label, value }));
  items.sort((a, b) => b.value - a.value);

  const colors = [COLORS.dadoDois, COLORS.dadoTres, COLORS.dadoUm];

  const barData = items.length ? items.slice(0, 5).map((it, idx) => ({ value: it.value, label: it.label, frontColor: colors[idx % colors.length] })) : [];

  return (
    <View style={styles.section}>
      <ProfileCard title="Tempo em sites (em minutos)">
        <View style={styles.chartWrapper}>
          {barData.length > 0 ? (
            <BarChart horizontal data={barData} noOfSections={5} barBorderRadius={100} yAxisThickness={0} xAxisThickness={0} labelsDistanceFromXaxis={20} endSpacing={0}/>
          ) : (
            <Text style={{ color: COLORS.perfilInfoValor }}>Nenhum dado de tempo disponível</Text>
          )}
        </View>
      </ProfileCard>
    </View>
  );
}
