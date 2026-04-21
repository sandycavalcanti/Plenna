/**
 * Arquivo: ProfileScreen/index.js
 * Descrição: Tela de perfil do usuário, responsável por organizar e exibir
 * os componentes de informações pessoais, permissões, metas e preferências de orçamento.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importações necessárias para a tela de perfil
import React from 'react';
import { ScrollView } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
// Importação dos componentes que compõem a tela de perfil
import ProfileHeader from '../../components/ProfileComponents/ProfileHeader';
import PersonalInfo from '../../components/ProfileComponents/PersonalInfo';
import BudgetPreferences from '../../components/BudgetPreferences';
import Goals from '../../components/ProfileComponents/Goals';
import Permissions from '../../components/ProfileComponents/Permissions';

/**
 * Componente: ProfileScreen
 * Responsabilidade: Estruturar a tela de perfil com rolagem,
 * organizando os diferentes blocos de informação do usuário
 */
export default function ProfileScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const bottomSpacing = tabBarHeight + insets.bottom + 32;

  return (
    // Container com rolagem para acomodar todos os componentes
    <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomSpacing }]} scrollIndicatorInsets={{ bottom: bottomSpacing }}>
      {/* Cabeçalho do perfil */}
      <ProfileHeader />

      {/* Informações pessoais do usuário */}
      <PersonalInfo />

      {/* Configurações de permissões */}
      <Permissions />

      {/* Metas financeiras */}
      <Goals />

      {/* Preferências de orçamento */}
      <BudgetPreferences />
    </ScrollView>
  );
}
