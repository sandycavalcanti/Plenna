/**
 * Arquivo: ProfileScreen/index.js
 * Descrição: Tela de perfil do usuário, responsável por organizar e exibir
 * os componentes de informações pessoais, permissões, metas e preferências de orçamento.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importações necessárias para a tela de perfil
import React, { useEffect, useRef, useState } from 'react';
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
import { apiClient } from '../../api/client';
import { CatchError } from '../../api/constants';

/**
 * Componente: ProfileScreen
 * Responsabilidade: Estruturar a tela de perfil com rolagem,
 * organizando os diferentes blocos de informação do usuário
 */
export default function ProfileScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const bottomSpacing = tabBarHeight + insets.bottom + 10;
  const [recarregar, setRecarregar] = useState(0);
  const nome = useRef('');
  const email = useRef('');
  const telefone = useRef('');
  const dataNascimento = useRef('');
  const gastoIdealMensal = useRef('');
  const gastoIdealCompra = useRef('');
  const tempoIdeal = useRef('');
  const limiteCompra = useRef('');
  const [metas, setMetas] = useState([]);
  const [preferencias, setPreferencias] = useState([]);

  useEffect(() => {
    Selecionar();
    selecionarMetas();
    selecionarPreferencias();
  }, []);

  function Selecionar() {
    apiClient
      .get('/users/user')
      .then((response) => {
        const dados = response.data;
        nome.current = dados.usuario_nome;
        email.current = dados.usuario_email;
        telefone.current = dados.usuario_telefone;
        dataNascimento.current = dados.usuario_data_nascimento;
        gastoIdealMensal.current = dados.usuario_meta_valor_mensal;
        gastoIdealCompra.current = dados.usuario_meta_valor_compra;
        tempoIdeal.current = dados.usuario_meta_tempo;
        limiteCompra.current = dados.usuario_meta_limite_compra;
        setRecarregar((prev) => prev + 1);
      })
      .catch(CatchError);
  }

  function selecionarMetas() {
    apiClient
      .get('/goals')
      .then((response) => {
        const dados = response.data;
        setMetas(dados);
      })
      .catch(CatchError);
  }

  function selecionarPreferencias() {
    apiClient
      .get('/preferencia')
      .then((response) => {
        const dados = response.data;
        setPreferencias(dados);
      })
      .catch(CatchError);
  }

  return (
    // Container com rolagem para acomodar todos os componentes
    <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomSpacing }]} scrollIndicatorInsets={{ bottom: bottomSpacing }}>
      {/* Cabeçalho do perfil */}
      <ProfileHeader nome={nome.current} />

      {/* Informações pessoais do usuário */}
      <PersonalInfo email={email.current} telefone={telefone.current} dataNascimento={dataNascimento.current} />

      {/* Metas financeiras */}
      <Goals metas={metas} />

      {/* Preferências de orçamento */}
      <BudgetPreferences gastoIdealMensal={gastoIdealMensal.current} gastoIdealCompra={gastoIdealCompra.current} preferencias={preferencias} />

      {/* Configurações de permissões */}
      <Permissions />
    </ScrollView>
  );
}
