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
import ProfileCard from '../ProfileCard';
import styles from './styles';

/**
 * Componente: BudgetPreferences
 * Responsabilidade: Renderizar informações de preferências financeiras do usuário
 */
export default function BudgetPreferences() {
  return (
    // Card principal que encapsula o conteúdo
    <ProfileCard title="Preferências" onEdit={() => {}}>

      {/* Seção principal com o valor total esperado */}
      <View style={styles.mainBox}>
        <Text style={styles.label}>
          Expectativa de gasto ideal
        </Text>

        {/* Valor total definido pelo usuário */}
        <Text style={styles.value}>
          R$290,00
        </Text>
      </View>

      {/* Linha com categorias de gastos */}
      <View style={styles.row}>

        {/* Categoria: Moda */}
        <View style={styles.smallBox}>
          <Text>Moda</Text>
          <Text>R$200,00</Text>
        </View>

        {/* Categoria: Higiene */}
        <View style={styles.smallBox}>
          <Text>Higiene</Text>
          <Text>R$90,00</Text>
        </View>

      </View>

    </ProfileCard>
  );
}