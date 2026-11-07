/**
 * Arquivo: Metas/index.js
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
import { logApiErrors } from '../../../utils/error';
import { COLORS } from '../../../constants';
import { formatarValorMeta, formatarPercentualMeta } from '../../../utils/metaMoney';
import { concluirMeta } from '../../../api/metas';

/**
 * Componente: Metas
 * Responsabilidade: Renderizar informações de metas financeiras do usuário
 */
export default function Metas({ metas, error = false, onRetry }) {
  const navigation = useNavigation();
  const [metasVisiveis, setMetasVisiveis] = useState(metas || []);

  useEffect(() => {
    setMetasVisiveis(metas || []);
  }, [metas]);

  function alternarMeta(metaId, isCompleted) {
    concluirMeta(metaId, !isCompleted)
      .then((response) => {
        setMetasVisiveis((current) => current.map((meta) => (meta.meta_id === metaId ? { ...meta, meta_completado: !meta.meta_completado } : meta)));
      })
      .catch((error) => logApiErrors(error, 'Erro ao atualizar meta'));
  }

  function abrirMeta(meta) {
    navigation.navigate('MetaDetails', { metaId: meta.meta_id, meta });
  }

  return (
    // Card principal que encapsula o conteúdo de metas
    <ProfileCard title="Metas" onEdit={() => navigation.navigate('EditProfile', { mode: 'metas' })}>
      {error ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateTitle}>Não foi possível carregar suas metas.</Text>
          <Pressable onPress={onRetry} accessibilityRole="button">
            <Text style={styles.emptyStateAction}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : metasVisiveis.length === 0 ? (
        <Pressable style={styles.emptyStateContainer} onPress={() => navigation.navigate('EditProfile', { mode: 'metas' })}>
          <Text style={styles.emptyStateTitle}>Ei, você ainda não tem metas!</Text>
          <Text style={styles.emptyStateSubtitle}>Quer adicionar agora e começar a acompanhar seus objetivos?</Text>
          <Text style={styles.emptyStateAction}>Adicionar metas</Text>
        </Pressable>
      ) : (
        metasVisiveis.map((meta) => (
          <View key={meta.meta_id} style={styles.metaItem}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={`${meta.meta_completado ? 'Desmarcar' : 'Marcar'} meta ${meta.meta_titulo} como concluída`}
              accessibilityState={{ checked: meta.meta_completado }}
              onPress={() => alternarMeta(meta.meta_id, meta.meta_completado)}
              style={[styles.checkbox, meta.meta_completado && styles.checkboxChecked]}
            >
              {meta.meta_completado && <Feather name="check" size={18} color={COLORS.perfilCheckColor} />}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir detalhes da meta ${meta.meta_titulo}`}
              onPress={() => abrirMeta(meta)}
              style={styles.metaContent}
            >
              <Text style={styles.metaName}>{meta.meta_titulo}</Text>
              <Text style={styles.value}>Objetivo: {formatarValorMeta(meta.meta_valor) || 'Valor não informado'}</Text>
              {meta.meta_valor_reservado !== undefined && meta.meta_valor_reservado !== null ? <Text style={styles.value}>Reservado: {formatarValorMeta(meta.meta_valor_reservado) || 'Valor não informado'}</Text> : <Text style={styles.value}>Reservado: Valor não informado</Text>}
              {meta.progresso_percentual !== undefined && meta.progresso_percentual !== null ? <Text style={styles.value}>Progresso: {formatarPercentualMeta(meta.progresso_percentual)}</Text> : <Text style={styles.value}>Progresso: Percentual indisponível</Text>}
              {meta.valor_restante !== undefined && meta.valor_restante !== null ? <Text style={styles.value}>Restante: {formatarValorMeta(meta.valor_restante) || 'Valor não informado'}</Text> : <Text style={styles.value}>Restante: Valor não informado</Text>}
            </Pressable>
          </View>
        ))
      )}
    </ProfileCard>
  );
}
