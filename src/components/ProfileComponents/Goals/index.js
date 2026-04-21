/**
 * Arquivo: Goals/index.js
 * Descrição: Componente responsável por exibir as metas financeiras do usuário,
 * incluindo descrição da meta e valor associado.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importações necessárias para o componente
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ProfileCard from '../ProfileCard';
import styles from './styles';

/**
 * Componente: Goals
 * Responsabilidade: Renderizar informações de metas financeiras do usuário
 */
export default function Goals() {
  const [goals, setGoals] = useState([
    { id: 1, name: 'Viajar para Alemanha', value: 'R$5.000,00', checked: true },
    { id: 2, name: 'Montar reserva de emergência', value: 'R$3.000,00', checked: false },
    { id: 3, name: 'Trocar de notebook', value: 'R$4.500,00', checked: false },
    { id: 4, name: 'Curso de especialização', value: 'R$1.200,00', checked: false },
  ]);

  function handleToggleGoal(goalId) {
    setGoals((prevGoals) => prevGoals.map((goal) => (goal.id === goalId ? { ...goal, checked: !goal.checked } : goal)));
  }

  return (
    // Card principal que encapsula o conteúdo de metas
    <ProfileCard title="Metas" onEdit={() => {}}>
      {goals.map((goal) => (
        <Pressable key={goal.id} style={styles.goalItem} onPress={() => handleToggleGoal(goal.id)}>
          {/* Indicador de status da meta */}
          <View style={[styles.checkbox, goal.checked && styles.checkboxChecked]}>{goal.checked && <Feather name="check" size={18} color="#111111" />}</View>

          {/* Conteúdo da meta */}
          <View style={styles.goalContent}>
            <Text style={styles.goalName}>{goal.name}</Text>

            <Text style={styles.value}>Valor: {goal.value}</Text>
          </View>
        </Pressable>
      ))}
    </ProfileCard>
  );
}
