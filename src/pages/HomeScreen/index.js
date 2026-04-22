import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';
import GastosTotais from '../../components/DashboardComponents/GastosGerais';

export default function HomeScreen() {
  return (
    <View style={ styles.container }>
          <GastosTotais/>
    </View>
  );
}