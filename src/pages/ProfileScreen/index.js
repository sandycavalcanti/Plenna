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
// Importação dos componentes que compõem a tela de perfil
import ProfileHeader from '../../components/ProfileHeader';
import PersonalInfo from '../../components/PersonalInfo';
import BudgetPreferences from '../../components/BudgetPreferences';
import Goals from '../../components/Goals';
import Permissions from '../../components/Permissions';

/**
 * Componente: ProfileScreen
 * Responsabilidade: Estruturar a tela de perfil com rolagem,
 * organizando os diferentes blocos de informação do usuário
 */
export default function ProfileScreen() {
  return (
    // Container com rolagem para acomodar todos os componentes
    <ScrollView style={{ padding: 16 }}>

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
