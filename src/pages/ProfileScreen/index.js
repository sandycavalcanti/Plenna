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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { invalidateProtectedSession } from '../../services/security/protectedSession';
import { useProtectedAccess } from '../../hooks/useProtectedAccess';
import PinModal from '../../components/SecurityComponents/PinModal';

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
  const [changePinRequested, setChangePinRequested] = useState(false);
  const [changePinModalVisible, setChangePinModalVisible] = useState(false);
  const protectedAccess = useProtectedAccess();

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
      // O desbloqueio é somente da sessão corrente; logout precisa removê-lo
      // antes que outra conta possa entrar no mesmo aparelho.
      invalidateProtectedSession();
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

    Alert.alert('Confirmação', 'Tem certeza que deseja apagar sua conta?', [
      { text: 'Cancelar', style: 'cancel', onPress: () => setAccountActionLoading(false) },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete('/users');
            await tokenStorage.clearToken();
            invalidateProtectedSession();
            goToLogin();
          } catch {
            Alert.alert('Não foi possível apagar a conta', 'Tente novamente em alguns instantes.');
          } finally {
            setAccountActionLoading(false);
          }
        },
      },
    ]);
  }, [accountActionLoading, goToLogin]);

  useEffect(() => {
    if (protectedAccess.status !== 'unlocked') {
      // Se o app for para background enquanto o modal de alteração estiver
      // aberto, fechamos a operação para não permitir alteração sem uma nova
      // autenticação ao retornar.
      setChangePinModalVisible(false);
    }
  }, [protectedAccess.status]);

  useEffect(() => {
    if (protectedAccess.status !== 'unlocked' || !changePinRequested) return;

    setChangePinRequested(false);
    // Quando ainda não havia PIN, o fluxo de setup já concluiu a ação pedida.
    // Quando havia PIN, o gate acabou de autenticar o usuário e agora podemos
    // abrir a etapa específica de criação do novo verificador.
    if (!protectedAccess.setupCompleted) setChangePinModalVisible(true);
  }, [changePinRequested, protectedAccess.setupCompleted, protectedAccess.status]);

  const handleChangePin = useCallback(() => {
    setChangePinRequested(true);
    // A alteração de uma credencial local é uma ação sensível. Mesmo que
    // Purchases tenha sido desbloqueada há pouco, exigimos biometria ou PIN
    // novamente para impedir troca de PIN sem uma nova prova de identidade.
    protectedAccess.beginAccess({ forceReauthentication: true });
  }, [protectedAccess]);

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
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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

        {/*
          A alteração do PIN fica no Perfil, mas continua protegida pelo mesmo
          gate local: biometria é tentada primeiro e o PIN atual é o fallback.
          Nenhuma recuperação por exclusão simples é oferecida.
        */}
        <TouchableOpacity
          style={{ marginTop: 18, marginHorizontal: 16, padding: 16, borderRadius: 16, backgroundColor: COLORS.perfilPermissaoAvisoFundo, borderWidth: 1, borderColor: COLORS.perfilPermissaoAvisoBorda }}
          onPress={handleChangePin}
          activeOpacity={0.8}>
          <Text style={{ color: COLORS.perfilProfileCardTitulo, fontSize: 16, fontWeight: '700' }}>Segurança das compras</Text>
          <Text style={{ color: COLORS.perfilPermissaoAvisoTexto, marginTop: 5 }}>Alterar PIN</Text>
        </TouchableOpacity>
        {protectedAccess.status === 'biometric' ? (
          <TouchableOpacity
            style={{ alignSelf: 'center', marginTop: 10, padding: 10 }}
            onPress={protectedAccess.usePinFallback}
            activeOpacity={0.8}>
            <Text style={{ color: COLORS.perfilProfileCardTitulo, fontWeight: '700' }}>Usar PIN</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <PinModal
        visible={protectedAccess.status === 'setup' || protectedAccess.status === 'pin'}
        mode={protectedAccess.status === 'setup' ? 'setup' : 'unlock'}
        errorMessage={protectedAccess.errorMessage}
        onSubmit={protectedAccess.status === 'setup' ? protectedAccess.completeSetup : protectedAccess.submitPin}
        onCancel={protectedAccess.cancelAccess}
      />

      <PinModal
        visible={changePinModalVisible}
        mode="change"
        errorMessage={protectedAccess.errorMessage}
        onSubmit={async (pin, confirmation) => {
          const changed = await protectedAccess.changePin(pin, confirmation);
          if (changed) setChangePinModalVisible(false);
        }}
        onCancel={() => setChangePinModalVisible(false)}
      />
    </SafeAreaView>
  );
}
