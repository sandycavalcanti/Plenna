/**
 * Arquivo: Goals/index.js
 * Descrição: Componente responsável por exibir as metas financeiras do usuário,
 * incluindo descrição da meta e valor associado.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importações necessárias para o componente
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import ProfileCard from '../ProfileCard';
import styles from './styles';
import { apiClient } from '../../../api/client';
import { logApiErrors } from '../../../utils/error';
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
      .catch((error) => logApiErrors(error, 'Erro ao atualizar meta'));
  }

  function openGoal(goal) {
    navigation.navigate('GoalDetails', { goalId: goal.meta_id, goal });
  }

  return (
    // Card principal que encapsula o conteúdo de metas
    <ProfileCard title="Metas" onEdit={() => navigation.navigate('EditProfile', { mode: 'goals' })}>
      {goals.length === 0 ? (
        <Pressable style={styles.emptyStateContainer} onPress={() => navigation.navigate('EditProfile', { mode: 'goals' })}>
          <Text style={styles.emptyStateTitle}>Ei, você ainda não tem metas!</Text>
          <Text style={styles.emptyStateSubtitle}>Quer adicionar agora e começar a acompanhar seus objetivos?</Text>
          <Text style={styles.emptyStateAction}>Adicionar metas</Text>
        </Pressable>
      ) : (
        goals.map((goal) => (
          <View key={goal.meta_id} style={styles.goalItem}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={`${goal.meta_completado ? 'Desmarcar' : 'Marcar'} meta ${goal.meta_titulo} como concluída`}
              accessibilityState={{ checked: goal.meta_completado }}
              onPress={() => handleToggleGoal(goal.meta_id, goal.meta_completado)}
              style={[styles.checkbox, goal.meta_completado && styles.checkboxChecked]}
            >
              {goal.meta_completado && <Feather name="check" size={18} color={COLORS.perfilCheckColor} />}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir detalhes da meta ${goal.meta_titulo}`}
              onPress={() => openGoal(goal)}
              style={styles.goalContent}
            >
              <Text style={styles.goalName}>{goal.meta_titulo}</Text>
              <Text style={styles.value}>Objetivo: {formatarValorMoedaParaTela(goal.meta_valor) || 'R$ 0,00'}</Text>
              {goal.meta_valor_reservado !== undefined && goal.meta_valor_reservado !== null ? <Text style={styles.value}>Reservado: {formatarValorMoedaParaTela(goal.meta_valor_reservado) || 'R$ 0,00'}</Text> : null}
              {goal.progresso_percentual !== undefined && goal.progresso_percentual !== null ? <Text style={styles.value}>Progresso: {String(goal.progresso_percentual).replace('.', ',')}%</Text> : null}
            </Pressable>
          </View>
        ))
      )}
    </ProfileCard>
  );
}
