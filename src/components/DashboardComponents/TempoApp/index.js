import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import { styles } from './styles';
import { COLORS } from '../../../constants';

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
    <View style={styles.section}>
      <ProfileCard title="Tempo em sites (em minutos)">
        <View style={styles.chartWrapper}>
          <BarChart horizontal data={barData} noOfSections={4} barBorderRadius={100} yAxisThickness={0} xAxisThickness={0} labelsDistanceFromXaxis={20} />
        </View>
      </ProfileCard>
    </View>
  );
}