import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './styles';
import { COLORS } from '../../constants/colors';

export default function PurchaseHero() {
  const navigation = useNavigation();

  const handleNovaCompra = () => {
    navigation.navigate('CreateCompra');
  };

  const handleImportarCompra = () => {
    Alert.alert('Em desenvolvimento', 'Essa funcionalidade ainda não existe.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleNovaCompra}>
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Nova compra</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleImportarCompra}>
            <MaterialCommunityIcons name="cloud-download-outline" size={18} color={COLORS.dadoDois} />
            <Text style={styles.secondaryButtonText}>Importar compra</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
