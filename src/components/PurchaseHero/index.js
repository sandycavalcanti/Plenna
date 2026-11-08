import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './styles';

export default function PurchaseHero() {
  const navigation = useNavigation();

  const handleNovaCompra = () => {
    navigation.navigate('CreateCompra');
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleNovaCompra}>
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Nova compra</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
