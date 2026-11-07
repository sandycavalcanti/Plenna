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
import CustomButton from '../../CustomButton';
import styles from './styles';
import { COLORS } from '../../../constants';

/**
 * Componente: ProfileCard
 * Responsabilidade: Estruturar visualmente seções com título, ação de edição
 * e renderização de conteúdo filho (children)
 */
export default function ProfileCard({ title, children, onEdit, actionLabel, actionIcon = null, actionAccessibilityLabel, onRemove, onToggleCollapse, isCollapsed = false, style, variant = 'default' }) {
  const isDashboard = variant === 'dashboard';
  const isProfile = variant === 'profile';

  return (
    // Container principal do card
    <View style={[styles.container, isDashboard && styles.dashboardContainer, isProfile && styles.profileContainer, style]}>
      {/* Cabeçalho com título e ação de edição */}
      <View style={[styles.header, isDashboard && styles.dashboardHeader, isProfile && styles.profileHeader]}>
        {/* Título da seção */}
        <View style={[styles.titleWrapper, isDashboard && styles.dashboardTitleWrapper, isProfile && styles.profileTitleWrapper]}>
          <Text style={[styles.title, isDashboard && styles.dashboardTitle, isProfile && styles.profileTitle]}>{title}</Text>
        </View>

        {/* Botões de ação */}
        <View style={styles.actionsWrapper}>
          {onToggleCollapse ? (
            <TouchableOpacity style={styles.editButton} onPress={onToggleCollapse}>
              <Feather name={isCollapsed ? 'plus' : 'minus'} size={18} color={COLORS.perfilIconeEditar} />
            </TouchableOpacity>
          ) : null}

          {isProfile && actionIcon && onEdit ? (
            <CustomButton
              accessibilityLabel={actionAccessibilityLabel || actionLabel || title}
              variant="ghost"
              icon={actionIcon}
              iconOnly
              onPress={onEdit}
              style={styles.profileIconAction}
            />
          ) : isProfile && actionLabel && onEdit ? (
            <CustomButton title={actionLabel} variant="ghost" onPress={onEdit} style={styles.profileAction} />
          ) : onEdit ? (
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
      <View style={[styles.content, isDashboard && styles.dashboardContent, isProfile && styles.profileContent]}>{children}</View>
    </View>
  );
}
