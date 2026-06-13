import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './styles';
import GastosTotais from '../../components/DashboardComponents/GastosGerais';
import PurchaseHero from '../../components/PurchaseHero';
import { COLORS } from '../../constants/colors';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import AlertasHabito from '../../components/DashboardComponents/AlertasHabito';

export default function HomeScreen({ navigation }) {
  const { fetchCompras, fetchUsuario } = useDataRefresh();
  const [compras, setCompras] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const refetchAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [comprasData, usuarioData] = await Promise.all([fetchCompras(), fetchUsuario()]);

      setCompras(comprasData.compras);
      setUsuario(usuarioData);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCompras, fetchUsuario]);

  useEffect(() => {
    refetchAllData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetchAllData();
    }, [refetchAllData]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, marginTop: 10 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAllData} tintColor={COLORS.dadoUm} />}>
        <View style={styles.topBar}>
          <View style={styles.topBarTextBlock}>
            <Text style={styles.greeting}>Olá, {usuario?.usuario_nome}!</Text>
            <Text style={styles.subtitle}>Vamos ter um mês mais consciente?</Text>
          </View>

          <TouchableOpacity style={styles.notificationButton} onPress={() => {}} activeOpacity={0.8}>
            <MaterialCommunityIcons name="bell-outline" size={26} color={COLORS.dadoUm} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <PurchaseHero />
        <GastosTotais compras={compras} meta={usuario?.usuario_meta_valor_mensal} />

        <AlertasHabito />

        {/* <Text style={{ marginVertical: 20, color: COLORS.cadTitulo, fontSize: 18, textAlign: 'center' }} onPress={() => navigation.navigate('Login')}>
          Voltar para Login
        </Text> */}
      </ScrollView>
    </SafeAreaView>
  );
}
