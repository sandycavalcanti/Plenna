/**
 * Arquivo: ProfileScreen/index.js
 * Descrição: Tela de perfil do usuário, responsável por organizar e exibir
 * os componentes de informações pessoais, permissões, metas e preferências de orçamento.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importações necessárias para a tela de perfil
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, ScrollView, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
// Importação dos componentes que compõem a tela de perfil
import ProfileHeader from '../../components/ProfileComponents/ProfileHeader';
import PersonalInfo from '../../components/ProfileComponents/PersonalInfo';
import BudgetPreferences from '../../components/BudgetPreferences';
import Goals from '../../components/ProfileComponents/Goals';
import Permissions from '../../components/ProfileComponents/Permissions';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';

/**
 * Componente: ProfileScreen
 * Responsabilidade: Estruturar a tela de perfil com rolagem,
 * organizando os diferentes blocos de informação do usuário
 */
export default function ProfileScreen() {
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const bottomSpacing = tabBarHeight + insets.bottom + 10;
  const { fetchUsuario, fetchMetas, fetchPreferencias } = useDataRefresh();

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
  const [recarregar, setRecarregar] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);

  const goToLogin = useCallback(() => {
    const parentNavigation = navigation.getParent();

    if (parentNavigation?.replace) {
      parentNavigation.replace('Login');
      return;
    }

    navigation.navigate('Login');
  }, [navigation]);

  const handleLogout = useCallback(async () => {
    if (accountActionLoading) {
      return;
    }

    setAccountMenuVisible(false);
    setAccountActionLoading(true);

    try {
      await tokenStorage.clearToken();
      goToLogin();
    } finally {
      setAccountActionLoading(false);
    }
  }, [accountActionLoading, goToLogin]);

  const handleDeleteAccount = useCallback(async () => {
    if (accountActionLoading) {
      return;
    }

    setAccountMenuVisible(false);
    setAccountActionLoading(true);

    try {
      await apiClient.delete('/users');
      await tokenStorage.clearToken();
      goToLogin();
    } catch {
      Alert.alert('Não foi possível apagar a conta', 'Tente novamente em alguns instantes.');
    } finally {
      setAccountActionLoading(false);
    }
  }, [accountActionLoading, goToLogin]);

  const handleAccountMenu = useCallback(() => {
    if (accountActionLoading) {
      return;
    }

    setAccountMenuVisible((currentVisible) => !currentVisible);
  }, [accountActionLoading]);

  const refetchAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [usuarioData, metasData, preferenciasData] = await Promise.all([fetchUsuario(), fetchMetas(), fetchPreferencias()]);

      if (usuarioData) {
        nome.current = usuarioData.usuario_nome;
        email.current = usuarioData.usuario_email;
        telefone.current = usuarioData.usuario_telefone;
        dataNascimento.current = usuarioData.usuario_data_nascimento;
        gastoIdealMensal.current = usuarioData.usuario_meta_valor_mensal;
        gastoIdealCompra.current = usuarioData.usuario_meta_valor_compra;
        tempoIdeal.current = usuarioData.usuario_meta_tempo;
        limiteCompra.current = usuarioData.usuario_meta_limite_compra;
      }

      setMetas(metasData);
      setPreferencias(preferenciasData);
      setRecarregar((prev) => prev + 1);
    } finally {
      setRefreshing(false);
    }
  }, [fetchUsuario, fetchMetas, fetchPreferencias]);

  useEffect(() => {
    refetchAllData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetchAllData();
    }, [refetchAllData]),
  );

  return (
    // Container com rolagem para acomodar todos os componentes
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomSpacing }]}
      scrollIndicatorInsets={{ bottom: bottomSpacing }}
      onScrollBeginDrag={() => setAccountMenuVisible(false)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAllData} tintColor={COLORS.dadoUm} />}>
      <View style={styles.accountActionRow}>
        <View style={styles.accountActionWrapper}>
          <TouchableOpacity
            style={[styles.accountActionButton, accountActionLoading && styles.accountActionButtonDisabled]}
            onPress={handleAccountMenu}
            activeOpacity={0.8}
            disabled={accountActionLoading}>
            <Feather name="more-vertical" size={26} color={COLORS.perfilIconeEditar} />
          </TouchableOpacity>

          {accountMenuVisible ? (
            <View style={styles.accountDropdown}>
              <TouchableOpacity style={styles.accountDropdownItem} onPress={handleLogout} activeOpacity={0.8} disabled={accountActionLoading}>
                <Feather name="log-out" size={16} color={COLORS.cadTitulo} />
                <Text style={styles.accountDropdownText}>Sair da conta</Text>
              </TouchableOpacity>

              <View style={styles.accountDropdownDivider} />

              <TouchableOpacity style={styles.accountDropdownItem} onPress={handleDeleteAccount} activeOpacity={0.8} disabled={accountActionLoading}>
                <Feather name="trash-2" size={16} color="#A31414" />
                <Text style={[styles.accountDropdownText, styles.accountDropdownTextDanger]}>Apagar conta</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>

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
