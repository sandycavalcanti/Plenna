import React from 'react';
import { View, Text } from 'react-native';
import GastosTotais from '../../components/DashboardComponents/GastosGerais';

export default function HomeScreen() {
  return (
    <View style={{ flex:1}}>
      
          <GastosTotais/>
    </View>
  );
}