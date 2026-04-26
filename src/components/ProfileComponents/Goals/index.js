/**
 * Arquivo: Goals/index.js
 * Descrição: Componente responsável por exibir as metas financeiras do usuário,
 * incluindo descrição da meta e valor associado.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importações necessárias para o componente
import React, { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import ProfileCard from "../ProfileCard";
import styles from "./styles";

/**
 * Componente: Goals
 * Responsabilidade: Renderizar informações de metas financeiras do usuário
 */
export default function Goals({ metas }) {
  const [goals, setGoals] = useState(metas);

  useEffect(() => {
    setGoals(metas);
  }, [metas]);

  function handleToggleGoal(goalId) {
    setGoals((prevGoals) =>
      prevGoals.map((goal) =>
        goal.meta_id === goalId
          ? { ...goal, meta_completado: !goal.meta_completado }
          : goal,
      ),
    );
  }
  return (
    // Card principal que encapsula o conteúdo de metas
    <ProfileCard title="Metas" onEdit={() => {}}>
      {goals.map((goal) => (
        <Pressable
          key={goal.meta_id}
          style={styles.goalItem}
          onPress={() => handleToggleGoal(goal.meta_id)}
        >
          {/* Indicador de status da meta */}
          <View
            style={[
              styles.checkbox,
              goal.meta_completado && styles.checkboxChecked,
            ]}
          >
            {goal.meta_completado && (
              <Feather name="check" size={18} color="#111111" />
            )}
          </View>

          {/* Conteúdo da meta */}
          <View style={styles.goalContent}>
            <Text style={styles.goalName}>{goal.meta_titulo}</Text>

            <Text style={styles.value}>Valor: {goal.meta_valor}</Text>
          </View>
        </Pressable>
      ))}
    </ProfileCard>
  );
}
