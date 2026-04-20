/**
 * Arquivo: Goals/index.js
 * Descrição: Componente responsável por exibir as metas financeiras do usuário,
 * incluindo descrição da meta e valor associado.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importações necessárias para o componente
import React from 'react';
import { View, Text } from 'react-native';
import ProfileCard from '../ProfileCard';
import styles from './styles';

/**
 * Componente: Goals
 * Responsabilidade: Renderizar informações de metas financeiras do usuário
 */
export default function Goals() {
  return (
    // Card principal que encapsula o conteúdo de metas
    <ProfileCard title="Metas" onEdit={() => {}}>

      {/* Item da meta com indicador visual (checkbox) */}
      <View style={styles.goalItem}>
        
        {/* Indicador de status da meta (não interativo) */}
        <View style={styles.checkbox} />

        {/* Descrição da meta */}
        <Text>
          Viajar para Alemanha
        </Text>
      </View>

      {/* Valor necessário para atingir a meta */}
      <Text style={styles.value}>
        Valor: R$5.000,00
      </Text>

    </ProfileCard>
  );
}