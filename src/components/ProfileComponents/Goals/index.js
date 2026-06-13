/**
 * Arquivo: Goals/index.js
 * Descrição: Componente responsável por exibir as metas financeiras do usuário,
 * incluindo descrição da meta e valor associado.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importações necessárias para o componente
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import ProfileCard from '../ProfileCard';
import styles from './styles';
import { apiClient } from '../../../api/client';
import { handleApiError } from '../../../utils/error';
import { COLORS } from '../../../constants';
import { formatarValorMoedaParaTela } from '../../CustomTextInput/currency';

/**
 * Componente: Goals
 * Responsabilidade: Renderizar informações de metas financeiras do usuário
 */
export default function Goals({ metas }) {
  const navigation = useNavigation();
  const [goals, setGoals] = useState(metas || []);

  useEffect(() => {
    setGoals(metas || []);
  }, [metas]);

  function handleToggleGoal(goalId, isCompleted) {
    apiClient
      .put(`/goals/check`, {
        meta_id: goalId,
        completado: !isCompleted,
      })
      .then((response) => {
        setGoals((prevGoals) => prevGoals.map((goal) => (goal.meta_id === goalId ? { ...goal, meta_completado: !goal.meta_completado } : goal)));
      })
      .catch((error) => handleApiError(error, 'Erro ao atualizar meta'));
  }

  return (
    // Card principal que encapsula o conteúdo de metas
    <ProfileCard title="Metas" onEdit={() => navigation.navigate('EditProfile', { mode: 'goals' })}>
      {goals.length === 0 ? (
        <Pressable style={styles.emptyStateContainer} onPress={() => navigation.navigate('EditProfile', { mode: 'goals' })}>
          <Text style={styles.emptyStateTitle}>Ei, voce ainda nao tem metas!</Text>
          <Text style={styles.emptyStateSubtitle}>Quer adicionar agora e comecar a acompanhar seus objetivos?</Text>
          <Text style={styles.emptyStateAction}>Adicionar metas</Text>
        </Pressable>
      ) : (
        goals.map((goal) => (
          <Pressable key={goal.meta_id} style={styles.goalItem} onPress={() => handleToggleGoal(goal.meta_id, goal.meta_completado)}>
            {/* Indicador de status da meta */}
            <View style={[styles.checkbox, goal.meta_completado && styles.checkboxChecked]}>{goal.meta_completado && <Feather name="check" size={18} color={COLORS.perfilCheckColor} />}</View>

            {/* Conteúdo da meta */}
            <View style={styles.goalContent}>
              <Text style={styles.goalName}>{goal.meta_titulo}</Text>

              <Text style={styles.value}>Valor: {formatarValorMoedaParaTela(goal.meta_valor) || 'R$ 0,00'}</Text>
            </View>
          </Pressable>
        ))
      )}
    </ProfileCard>
  );
}
