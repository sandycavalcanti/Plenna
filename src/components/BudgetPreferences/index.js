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
import ProfileCard from '../ProfileComponents/ProfileCard';
import styles from './styles';

/**
 * Componente: BudgetPreferences
 * Responsabilidade: Renderizar informações de preferências financeiras do usuário
 */
export default function BudgetPreferences({ valorIdeal, preferencias }) {
  const rows = [];

  for (let i = 0; i < preferencias.length; i += 2) {
    rows.push(preferencias.slice(i, i + 2));
  }

  return (
    // Card principal que encapsula o conteúdo
    <ProfileCard title="Preferências" onEdit={() => {}}>
      {/* Seção principal com o valor total esperado */}
      <View style={styles.mainBox}>
        <Text style={styles.label}>Expectativa de gasto ideal</Text>

        {/* Valor total definido pelo usuário */}
        <Text style={styles.value}>R$ {(parseFloat(valorIdeal) || 0).toFixed(2)}</Text>
      </View>

      {/* Linhas dinâmicas com categorias de gastos */}
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((item, itemIndex) => (
            <View key={`${item.categoria_nome}-${rowIndex}-${itemIndex}`} style={styles.smallBox}>
              <Text style={styles.label}>{item.categoria_nome}</Text>
              <Text style={styles.value}>R$ {(parseFloat(item.preferencias_categoria_meta_mensal) || 0).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      ))}
    </ProfileCard>
  );
}
