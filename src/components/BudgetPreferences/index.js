import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileCard from '../ProfileComponents/ProfileCard';
import styles from './styles';
import { formatarValorMonetarioParaTela } from '../CustomTextInput/currency';
import { COLORS } from '../../constants';

function formatarValorOuIndisponivel(value) {
  if (value === null || value === undefined || value === '') return 'Valor não informado';
  return formatarValorMonetarioParaTela(value) || 'Valor não informado';
}

function formatarAtencaoPorCompra(value) {
  if (value === null || value === undefined || value === '' || Number(value) <= 0) {
    return 'Valor de atenção não definido';
  }
  return formatarValorOuIndisponivel(value);
}

export default function BudgetPreferences({ gastoIdealMensal, gastoIdealCompra, preferencias = [] }) {
  const navigation = useNavigation();

  return (
    <ProfileCard
      title="Preferências financeiras"
      icon="credit-card"
      variant="profile"
      actionIcon="edit-2"
      actionAccessibilityLabel="Editar preferências financeiras"
      onEdit={() => navigation.navigate('EditPreferences')}
    >
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <View style={styles.summaryIcon} accessibilityElementsHidden>
            <MaterialCommunityIcons name="wallet-outline" size={17} color={COLORS.ink} />
          </View>
          <Text style={styles.label}>Meta de gasto mensal</Text>
          <Text style={styles.value}>{formatarValorOuIndisponivel(gastoIdealMensal)}</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryItemAttention]}>
          <View style={styles.summaryIcon} accessibilityElementsHidden>
            <MaterialCommunityIcons name="alert-circle-outline" size={17} color={COLORS.buttonPositiveText} />
          </View>
          <Text style={styles.label}>Valor de atenção por compra</Text>
          <Text style={styles.value}>{formatarAtencaoPorCompra(gastoIdealCompra)}</Text>
        </View>
      </View>

      <View style={styles.categoriesSection}>
        <Text style={styles.categoriesTitle}>Limites por categoria</Text>
        {preferencias.length > 0 ? preferencias.map((item) => (
          <View key={item.categoria_id ?? item.categoria_nome} style={styles.categoryRow}>
            <Text style={styles.categoryName} numberOfLines={2}>{item.categoria_nome || 'Categoria não informada'}</Text>
            <Text style={styles.categoryValue}>{formatarValorOuIndisponivel(item.preferencia_meta)}</Text>
          </View>
        )) : (
          <Text style={styles.emptyText}>Nenhum limite por categoria informado.</Text>
        )}
      </View>
    </ProfileCard>
  );
}
