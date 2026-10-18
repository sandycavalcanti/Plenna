/**
 * Arquivo: ProfileCard/index.js
 * Descrição: Componente reutilizável que encapsula seções do perfil,
 * exibindo um título, botão de edição e conteúdo interno dinâmico.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importações necessárias para o componente
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import styles from './styles';
import { COLORS } from '../../../constants';

/**
 * Componente: ProfileCard
 * Responsabilidade: Estruturar visualmente seções com título, ação de edição
 * e renderização de conteúdo filho (children)
 */
export default function ProfileCard({ title, children, onEdit, onRemove, onToggleCollapse, isCollapsed = false, style, variant = 'default' }) {
  const isDashboard = variant === 'dashboard';

  return (
    // Container principal do card
    <View style={[styles.container, isDashboard && styles.dashboardContainer, style]}>
      {/* Cabeçalho com título e ação de edição */}
      <View style={[styles.header, isDashboard && styles.dashboardHeader]}>
        {/* Título da seção */}
        <View style={[styles.titleWrapper, isDashboard && styles.dashboardTitleWrapper]}>
          <Text style={[styles.title, isDashboard && styles.dashboardTitle]}>{title}</Text>
        </View>

        {/* Botões de ação */}
        <View style={styles.actionsWrapper}>
          {onToggleCollapse ? (
            <TouchableOpacity style={styles.editButton} onPress={onToggleCollapse}>
              <Feather name={isCollapsed ? 'plus' : 'minus'} size={18} color={COLORS.perfilIconeEditar} />
            </TouchableOpacity>
          ) : null}

          {onEdit ? (
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Feather name="edit-2" size={18} color={COLORS.perfilIconeEditar} />
            </TouchableOpacity>
          ) : null}

          {onRemove ? (
            <TouchableOpacity style={styles.editButton} onPress={onRemove}>
              <Feather name="x" size={18} color={COLORS.perfilIconeEditar} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Conteúdo dinâmico do card */}
      <View style={[styles.content, isDashboard && styles.dashboardContent]}>{children}</View>
    </View>
  );
}
