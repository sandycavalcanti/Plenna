import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';
import GastosTotais from '../../components/DashboardComponents/GastosGerais';
import { COLORS } from '../../constants/colors';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <GastosTotais />
      <Text style={{ marginVertical: 20, color: COLORS.cadTitulo, fontSize: 18, textAlign: 'center' }} onPress={() => navigation.navigate('Login')}>
        Voltar para Login
      </Text>
    </View>
  );
}
