import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './styles';
import GastosTotais from '../../components/DashboardComponents/GastosGerais';
import PurchaseHero from '../../components/PurchaseHero';
import { COLORS } from '../../constants/colors';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.topBarTextBlock}>
          <Text style={styles.greeting}>Olá, Maria!</Text>
          <Text style={styles.subtitle}>Vamos ter um mês mais consciente?</Text>
        </View>

        <TouchableOpacity style={styles.notificationButton} onPress={() => {}} activeOpacity={0.8}>
          <MaterialCommunityIcons name="bell-outline" size={26} color={COLORS.dadoUm} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <PurchaseHero />
      <GastosTotais />
      <Text style={{ marginVertical: 20, color: COLORS.cadTitulo, fontSize: 18, textAlign: 'center' }} onPress={() => navigation.navigate('Login')}>
        Voltar para Login
      </Text>
    </SafeAreaView>
  );
}
