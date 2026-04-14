import React from 'react';
import { ScrollView, Text } from 'react-native';
import { BarChart, LineChart, PieChart, PopulationPyramid, RadarChart, BubbleChart } from "react-native-gifted-charts";
import Categoria from '../../components/DashboardComponents/Categoria/categoria';
import TempoApp from '../../components/DashboardComponents/TempoApp';
import GastosTotais from '../../components/DashboardComponents/GastosGerais';
import AlertasHabito from '../../components/DashboardComponents/AlertasHabito';

export default function DashboardScreen() {
  return (
    <ScrollView style={{ flex:1 }}>

    <GastosTotais/>
    <Categoria />    
    <TempoApp />
    <AlertasHabito />

    </ScrollView>
  );
}