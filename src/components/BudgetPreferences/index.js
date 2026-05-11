/**
 * Arquivo: BudgetPreferences/index.js
 * Descrição: Componente responsável por exibir as preferências de orçamento do usuário,
 * incluindo expectativa de gasto ideal e divisão por categorias.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importações necessárias para o componente
import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProfileCard from '../ProfileComponents/ProfileCard';
import styles from './styles';

/**
 * Componente: BudgetPreferences
 * Responsabilidade: Renderizar informações de preferências financeiras do usuário
 */
export default function BudgetPreferences({ gastoIdealMensal, gastoIdealCompra, preferencias }) {
  const navigation = useNavigation();
  const rows = [];

  for (let i = 0; i < preferencias.length; i += 2) {
    rows.push(preferencias.slice(i, i + 2));
  }

  const formatarTempo = (horas) => {
    const num = parseFloat(horas) || 0;
    return `${Math.floor(num)}h`;
  };

  return (
    // Card principal que encapsula o conteúdo
    <ProfileCard title="Preferências" onEdit={() => navigation.navigate('EditPreferences')}>
      {/* Seção principal com o valor total esperado */}
      <View style={styles.mainBox}>
        <Text style={styles.label}>Meta de gasto mensal</Text>
        <Text style={styles.value}>R$ {(parseFloat(gastoIdealMensal) || 0).toFixed(2)}</Text>
      </View>

      {/* Caixa de gasto máximo por compra */}
      <View style={styles.mainBox}>
        <Text style={styles.label}>Gasto máximo por compra</Text>
        <Text style={styles.value}>R$ {(parseFloat(gastoIdealCompra) || 0).toFixed(2)}</Text>
      </View>

      {/* Linhas dinâmicas com categorias de gastos */}
      <View style={styles.categoriesSection}>
        <Text style={styles.categoriesTitle}>Limite por categoria</Text>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((item, itemIndex) => (
              <View key={`${item.categoria_nome}-${rowIndex}-${itemIndex}`} style={styles.smallBox}>
                <Text style={styles.label}>{item.categoria_nome}</Text>
                <Text style={styles.value}>R$ {(parseFloat(item.preferencia_meta) || 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ProfileCard>
  );
}
