import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './styles';
import GastosTotais from '../../components/DashboardComponents/GastosGerais';
import PurchaseHero from '../../components/PurchaseHero';
import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import { CatchError } from '../../api/constants';
import AlertasHabito from '../../components/DashboardComponents/AlertasHabito';

export default function HomeScreen({ navigation }) {
  const [compras, setCompras] = useState([]);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    selecionarCompras();
    selecionarUsuario();
  }, []);

  function selecionarCompras() {
    apiClient
      .get('/compras')
      .then((response) => {
        const data = response.data || [];
        const items = data.flatMap((c) => (Array.isArray(c.tb_compra_item) ? c.tb_compra_item.map((item) => ({ ...item, compra_id: c.compra_id })) : []));
        setCompras(data);
      })
      .catch(CatchError);
  }

  function selecionarUsuario() {
    apiClient
      .get('/users/user')
      .then((response) => {
        setUsuario(response.data);
      })
      .catch(CatchError);
  }

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
      <GastosTotais compras={compras} meta={usuario?.usuario_meta_valor_mensal} />

      <AlertasHabito />      
      
      
      
      <Text style={{ marginVertical: 20, color: COLORS.cadTitulo, fontSize: 18, textAlign: 'center' }} onPress={() => navigation.navigate('Login')}>
        Voltar para Login
      </Text>
    </SafeAreaView>
  );
}
