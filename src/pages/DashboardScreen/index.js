import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import Categoria from '../../components/DashboardComponents/Categoria/categoria';
import TempoApp from '../../components/DashboardComponents/TempoApp';
import GastosTotais from '../../components/DashboardComponents/GastosGerais';
import AlertasHabito from '../../components/DashboardComponents/AlertasHabito';
import { styles } from './styles';

export default function DashboardScreen() {
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.monthChip} onPress={() => {}}>
          <MaterialIcons name="calendar-month" size={20} color="#111111" />

          <Text style={styles.monthChipText}>Janeiro</Text>
        </TouchableOpacity>

        <View style={styles.topBarActions}>
          <TouchableOpacity style={styles.iconAction} onPress={() => {}}>
            <MaterialIcons name="add" size={30} color="#111111" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconAction} onPress={() => {}}>
            <Feather name="filter" size={28} color="#111111" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]} showsVerticalScrollIndicator={false}>
        <GastosTotais />
        <Categoria />
        <TempoApp />
        <AlertasHabito/>
      </ScrollView>
    </SafeAreaView>
  );
}
