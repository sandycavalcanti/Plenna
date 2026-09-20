import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, AppState, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../api/client';
import { logApiErrors } from '../../utils/error';
import PurchaseItem from '../../components/PurchaseComponents/PurchaseItem';
import { COLORS } from '../../constants/colors';
import { styles } from './styles';
import PinModal from '../../components/SecurityComponents/PinModal';
import { PROTECTED_ACCESS_STATES, useProtectedAccess } from '../../hooks/useProtectedAccess';

/**
 * Tela que apresenta todas as compras retornadas para o usuário autenticado.
 * A autenticação não é feita manualmente aqui: o interceptor do apiClient
 * adiciona o token existente em todas as requisições.
 */
export default function PurchasesScreen() {
  const isFocused = useIsFocused();
  const protectedAccess = useProtectedAccess();
  // Estes estados distinguem carregamento inicial, erro, lista e exclusão.
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  // Um único item pode ser excluído por vez para evitar requests concorrentes
  // e manter o total da compra previsível durante a atualização.
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [focusRevision, setFocusRevision] = useState(0);

  /**
   * Busca a lista preservando a ordem definida pela API (data decrescente).
   * O erro fica separado da lista vazia para que os dois estados não sejam
   * apresentados como se fossem a mesma situação.
   */
  const loadPurchases = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);

    try {
      // GET /compras já usa o usuário do JWT no back-end.
      const response = await apiClient.get('/compras');
      setPurchases(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      logApiErrors(error, 'Erro ao carregar compras');
      setErrorMessage('Não foi possível carregar suas compras. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Recarrega ao entrar ou voltar para a tela, seguindo o padrão já usado na
   * Dashboard e garantindo dados atuais após retornar de outra tela.
   */
  useFocusEffect(
    useCallback(() => {
      // O foco apenas inicia o gate. A função loadPurchases só é disparada no
      // efeito abaixo depois que o gate informa status UNLOCKED, evitando que
      // GET /compras ou qualquer valor financeiro apareça antes da autenticação.
      setFocusRevision((revision) => revision + 1);
      protectedAccess.beginAccess();
    }, [protectedAccess.beginAccess]),
  );

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && isFocused) {
        // O AppState já invalidou a sessão ao entrar em background/inactive;
        // ao retornar com Purchases em foco, o gate precisa reabrir antes de
        // qualquer nova chamada financeira.
        protectedAccess.beginAccess();
      }
    });

    return () => subscription.remove();
  }, [isFocused, protectedAccess.beginAccess]);

  React.useEffect(() => {
    if (!isFocused || protectedAccess.status !== PROTECTED_ACCESS_STATES.UNLOCKED) return;

    // O request financeiro está deliberadamente atrás desta condição. O JWT
    // continua sendo usado normalmente pela API, mas não substitui a camada
    // local que protege a tela contra alguém com o aparelho desbloqueado.
    loadPurchases();
  }, [focusRevision, isFocused, loadPurchases, protectedAccess.lifecycleRevision, protectedAccess.status]);

  /**
   * Executa a exclusão somente depois de o back-end confirmar o DELETE 204.
   * A remoção local ocorre depois da resposta para não esconder uma compra
   * quando a operação falhar.
   *
   * Este hook precisa estar antes dos returns de segurança. A tela renderiza
   * primeiro o gate e só depois a lista, mas a ordem dos hooks deve permanecer
   * igual nos dois estados.
   */
  const handleDeletePurchase = useCallback(async (purchase) => {
    const purchaseId = purchase.compra_id;
    setDeletingId(purchaseId);

    try {
      // O interceptor adiciona a autenticação; nenhum token é manipulado aqui.
      await apiClient.delete(`/compras/${purchaseId}`);

      // Atualização otimista é evitada: só filtramos após o sucesso da API.
      setPurchases((currentPurchases) => currentPurchases.filter((item) => item.compra_id !== purchaseId));
      Alert.alert('Compra excluída', 'A compra foi removida com sucesso.');
    } catch (error) {
      logApiErrors(error, 'Erro ao excluir compra');
      Alert.alert('Erro', 'Não foi possível excluir a compra. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  }, []);

  /**
   * Exclui um item individual e substitui a compra pelo payload atualizado.
   * O novo total calculado no back-end chega junto com os itens restantes.
   * A declaração também fica incondicional para respeitar as Rules of Hooks.
   */
  const handleDeleteItem = useCallback(async (purchase, item) => {
    const purchaseId = purchase.compra_id;
    const itemId = item.compra_item_id;
    setDeletingItemId(itemId);

    try {
      // A API valida ownership, vínculo do item, último item e recalcula o total.
      const response = await apiClient.delete(`/compras/${purchaseId}/items/${itemId}`);

      // Substituímos somente a compra afetada para preservar a ordem da lista.
      setPurchases((currentPurchases) => currentPurchases.map((currentPurchase) => (
        currentPurchase.compra_id === purchaseId ? response.data : currentPurchase
      )));
    } catch (error) {
      logApiErrors(error, 'Erro ao excluir item da compra');
      const message = error.response?.data?.message || 'Não foi possível excluir o item. Tente novamente.';
      Alert.alert('Erro', message);
    } finally {
      setDeletingItemId(null);
    }
  }, []);

  function renderSecurityState() {
    const isBusy = [PROTECTED_ACCESS_STATES.CHECKING, PROTECTED_ACCESS_STATES.BIOMETRIC].includes(protectedAccess.status);
    const message = protectedAccess.status === PROTECTED_ACCESS_STATES.ERROR
      ? protectedAccess.errorMessage
      : protectedAccess.status === PROTECTED_ACCESS_STATES.BIOMETRIC
        ? 'Confirme sua identidade no aviso do aparelho.'
        : protectedAccess.status === PROTECTED_ACCESS_STATES.LOCKOUT
          ? protectedAccess.errorMessage
          : 'Suas compras ficam protegidas por uma confirmação local.';

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerIconBox}>
            <MaterialCommunityIcons name="shield-lock-outline" size={23} color={COLORS.cadTitulo} />
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={styles.title}>Minhas compras</Text>
            <Text style={styles.subtitle}>Confirmação necessária para continuar</Text>
          </View>
        </View>
        <View style={styles.stateContainer}>
          {isBusy ? <ActivityIndicator size="large" color={COLORS.dashboardIconeBotaoCanto} /> : null}
          <Text style={styles.stateText}>{message}</Text>
          {protectedAccess.status === PROTECTED_ACCESS_STATES.BIOMETRIC ? (
            <TouchableOpacity style={styles.retryButton} onPress={protectedAccess.usePinFallback}>
              <Text style={styles.retryButtonText}>Usar PIN</Text>
            </TouchableOpacity>
          ) : null}
          {protectedAccess.status === PROTECTED_ACCESS_STATES.ERROR ? (
            <TouchableOpacity style={styles.retryButton} onPress={protectedAccess.beginAccess}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <PinModal
          visible={protectedAccess.status === PROTECTED_ACCESS_STATES.SETUP || protectedAccess.status === PROTECTED_ACCESS_STATES.PIN}
          mode={protectedAccess.status === PROTECTED_ACCESS_STATES.SETUP ? 'setup' : 'unlock'}
          errorMessage={protectedAccess.errorMessage}
          onSubmit={protectedAccess.status === PROTECTED_ACCESS_STATES.SETUP ? protectedAccess.completeSetup : protectedAccess.submitPin}
          onCancel={protectedAccess.cancelAccess}
        />
      </SafeAreaView>
    );
  }

  // Enquanto qualquer autenticação está pendente, nenhum componente que
  // renderiza compras é montado. Isso cobre navegação direta, retorno do
  // background e abertura da tela por qualquer outro chamador.
  if (protectedAccess.status !== PROTECTED_ACCESS_STATES.UNLOCKED) {
    return renderSecurityState();
  }

  if (loading) {
    // O carregamento inicial ocupa a tela para não confundir ausência de dados
    // com uma lista realmente vazia.
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerIconBox}>
            <MaterialCommunityIcons name="shopping-outline" size={23} color={COLORS.cadTitulo} />
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={styles.title}>Minhas compras</Text>
            <Text style={styles.subtitle}>Acompanhe e organize suas compras</Text>
          </View>
        </View>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.dashboardIconeBotaoCanto} />
          <Text style={styles.stateText}>Carregando compras...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    // O erro possui uma tentativa explícita e não reutiliza o estado vazio.
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerIconBox}>
            <MaterialCommunityIcons name="shopping-outline" size={23} color={COLORS.cadTitulo} />
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={styles.title}>Minhas compras</Text>
            <Text style={styles.subtitle}>Acompanhe e organize suas compras</Text>
          </View>
        </View>
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadPurchases()}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Cabeçalho simples, alinhado ao padrão de telas com título do app. */}
      <View style={styles.header}>
        {/* O cabeçalho usa composição leve, sem uma faixa colorida pesada. */}
        <View style={styles.headerIconBox}>
          <MaterialCommunityIcons name="shopping-outline" size={23} color={COLORS.cadTitulo} />
        </View>
        <View style={styles.headerTextGroup}>
          <Text style={styles.title}>Minhas compras</Text>
          <Text style={styles.subtitle}>Acompanhe e organize suas compras</Text>
        </View>
      </View>

      {/*
        FlatList renderiza cada registro com o componente reutilizável. O
        RefreshControl oferece atualização manual sem adicionar nova tecnologia.
      */}
      <FlatList
        data={purchases}
        keyExtractor={(item) => String(item.compra_id)}
        renderItem={({ item }) => (
          <PurchaseItem
            purchase={item}
            isDeleting={deletingId === item.compra_id}
            hasItemDeleting={deletingItemId !== null}
            isItemDeleting={deletingItemId !== null && item.tb_compra_item?.some((purchaseItem) => purchaseItem.compra_item_id === deletingItemId)}
            onDelete={handleDeletePurchase}
            onDeleteItem={(purchaseItem) => handleDeleteItem(item, purchaseItem)}
          />
        )}
        contentContainerStyle={purchases.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPurchases(true)} tintColor={COLORS.dashboardIconeBotaoCanto} />}
        ListEmptyComponent={
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>Nenhuma compra encontrada.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
