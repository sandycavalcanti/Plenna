import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, AppState, FlatList, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
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
  // Cada card possui seu próprio loading para que uma confirmação/ignorar em
  // andamento não bloqueie ações de outras compras da lista.
  const [statusActions, setStatusActions] = useState({});
  const [focusRevision, setFocusRevision] = useState(0);
  const [activeStatus, setActiveStatus] = useState(null);
  const pagerRef = useRef(null);
  const pagerScrollX = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();

  /**
   * Busca a lista e aplica a prioridade visual de status no front-end.
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
      const visiblePurchases = (Array.isArray(response.data) ? response.data : [])
        .filter((purchase) => ['AGUARDANDO_CONFIRMACAO', 'CONFIRMADA'].includes(purchase.compra_status));
      setPurchases(sortPurchases(visiblePurchases));
    } catch (error) {
      logApiErrors(error, 'Erro ao carregar compras');
      setErrorMessage('Não foi possível carregar suas compras. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * A lista não depende da ordem do backend: pendentes exigem atenção e ficam
   * no topo e confirmadas ficam depois, sempre com as mais recentes primeiro.
   * IGNORADA é estado final e não faz parte da fonte visual desta tela.
   */
  function sortPurchases(list) {
    const statusPriority = { AGUARDANDO_CONFIRMACAO: 0, CONFIRMADA: 1 };
    return [...list].sort((first, second) => {
      const priority = (statusPriority[first.compra_status] ?? 1) - (statusPriority[second.compra_status] ?? 1);
      if (priority !== 0) return priority;
      return new Date(second.compra_horario).getTime() - new Date(first.compra_horario).getTime();
    });
  }

  /**
   * As abas são derivadas da única lista carregada da API. Isso evita manter
   * estados duplicados depois de Confirmar/Ignorar. O filtro explícito também
   * protege a UI caso uma API antiga ainda devolva algum registro IGNORADA:
   * esse estado é final no domínio e não possui representação recuperável.
   */
  const availableTabs = useMemo(() => {
    const tabDefinitions = [
      { status: 'AGUARDANDO_CONFIRMACAO', label: 'Pendentes' },
      { status: 'CONFIRMADA', label: 'Confirmadas' },
    ];

    return tabDefinitions
      .map((tab) => ({
        ...tab,
        count: purchases.filter((purchase) => purchase.compra_status === tab.status).length,
      }))
      .filter((tab) => tab.count > 0);
  }, [purchases]);

  /**
   * Se uma operação remove o último registro da aba ativa, selecionamos a
   * primeira aba ainda válida na prioridade Pendentes → Confirmadas. Assim a
   * UI nunca aponta para uma página removida após uma mudança de status.
   */
  useEffect(() => {
    if (availableTabs.length === 0) {
      if (activeStatus !== null) setActiveStatus(null);
      return;
    }

    const activeTabStillExists = availableTabs.some((tab) => tab.status === activeStatus);
    if (!activeTabStillExists) setActiveStatus(availableTabs[0].status);
    const validIndex = Math.max(0, availableTabs.findIndex((tab) => tab.status === activeStatus));
    pagerRef.current?.scrollToIndex({ index: validIndex, animated: false });
  }, [activeStatus, availableTabs]);

  /**
   * Cada página recebe sua própria lista derivada, mas todas continuam vindo
   * de `purchases`. O agrupamento evita manter estados duplicados para cada
   * status e torna a página do gesto consistente com a aba tocada.
   */
  const purchasesByStatus = useMemo(() => availableTabs.reduce((groups, tab) => {
    groups[tab.status] = purchases.filter((purchase) => purchase.compra_status === tab.status);
    return groups;
  }, {}), [availableTabs, purchases]);

  /**
   * Confirma uma compra pendente. O loading é por compra, então uma ação não
   * congela a lista inteira; em caso de erro o card não é alterado.
   */
  const handleConfirmPurchase = useCallback(async (purchase) => {
    if (statusActions[purchase.compra_id]) return;
    setStatusActions((current) => ({ ...current, [purchase.compra_id]: 'confirm' }));
    try {
      const response = await apiClient.post(`/compras/${purchase.compra_id}/confirm`, {});
      const updatedPurchase = response.data?.compra || response.data;
      setPurchases((currentPurchases) => sortPurchases(currentPurchases.map((item) => (
        item.compra_id === purchase.compra_id
          ? { ...item, ...updatedPurchase, compra_status: 'CONFIRMADA' }
          : item
      ))));
      // O sucesso usa uma mensagem única e curta; a mudança visual da lista
      // continua sendo a confirmação principal da operação concluída.
      Alert.alert('Compra confirmada com sucesso!');
    } catch (error) {
      logApiErrors(error, 'Erro ao confirmar compra');
      Alert.alert('Erro', 'Não foi possível confirmar a compra. Tente novamente.');
    } finally {
      setStatusActions((current) => {
        const next = { ...current };
        delete next[purchase.compra_id];
        return next;
      });
    }
  }, [statusActions]);

  /** A ação de ignorar só muda o status após o endpoint concluir com sucesso. */
  const handleIgnorePurchase = useCallback(async (purchase) => {
    if (statusActions[purchase.compra_id]) return;
    setStatusActions((current) => ({ ...current, [purchase.compra_id]: 'ignore' }));
    try {
      await apiClient.post(`/compras/${purchase.compra_id}/ignore`);
      // Ignorada permanece no banco, mas sai imediatamente da única lista
      // visual porque esse status final não é uma página recuperável.
      setPurchases((currentPurchases) => currentPurchases.filter((item) => item.compra_id !== purchase.compra_id));
      Alert.alert('Compra ignorada com sucesso!');
    } catch (error) {
      logApiErrors(error, 'Erro ao ignorar compra');
      Alert.alert('Erro', 'Não foi possível ignorar a compra. Tente novamente.');
    } finally {
      setStatusActions((current) => {
        const next = { ...current };
        delete next[purchase.compra_id];
        return next;
      });
    }
  }, [statusActions]);

  /**
   * Recarrega ao entrar ou voltar para a tela, seguindo o padrão já usado na
   * Dashboard e garantindo dados atuais após retornar de outra tela.
   */
  useFocusEffect(
    useCallback(() => {
      // O foco apenas inicia o gate. A função loadPurchases só é disparada no
      // efeito abaixo depois que o gate informa status UNLOCKED, evitando que
      // GET /compras ou qualquer valor financeiro apareça antes da autenticação.
      // Cada foco representa uma nova visita à área financeira. O gate só
      // dispara GET /compras depois de uma autenticação local bem-sucedida.
      setFocusRevision((revision) => revision + 1);
      protectedAccess.beginAccess();

      return () => {
        // Ao sair, a sessão em memória é invalidada e a lista é limpa para
        // impedir que valores financeiros permaneçam renderizáveis durante a
        // próxima entrada. Isso não é um re-render: é o encerramento real da
        // visita causado pela perda de foco da tela.
        protectedAccess.cancelAccess();
        setPurchases([]);
        setLoading(true);
        setErrorMessage(null);
        setStatusActions({});
      };
    }, [protectedAccess.beginAccess, protectedAccess.cancelAccess]),
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
      Alert.alert('Compra excluída com sucesso!');
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
      Alert.alert('Item excluído com sucesso!');
    } catch (error) {
      logApiErrors(error, 'Erro ao excluir item da compra');
      Alert.alert('Erro', 'Não foi possível excluir o item. Tente novamente.');
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

  function renderPurchaseCard({ item }) {
    return (
      <PurchaseItem
        purchase={item}
        isDeleting={deletingId === item.compra_id}
        hasItemDeleting={deletingItemId !== null}
        isItemDeleting={deletingItemId !== null && item.tb_compra_item?.some((purchaseItem) => purchaseItem.compra_item_id === deletingItemId)}
        isStatusActionRunning={Boolean(statusActions[item.compra_id])}
        statusAction={statusActions[item.compra_id]}
        onConfirm={handleConfirmPurchase}
        onIgnore={handleIgnorePurchase}
        onDelete={handleDeletePurchase}
        onDeleteItem={(purchaseItem) => handleDeleteItem(item, purchaseItem)}
      />
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
      {availableTabs.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          style={styles.tabsScroll}
        >
          {availableTabs.map((tab) => {
            const isActive = tab.status === activeStatus;
            const tabIndex = availableTabs.findIndex((availableTab) => availableTab.status === tab.status);
            return (
              <Pressable
                key={tab.status}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                onPress={() => {
                  setActiveStatus(tab.status);
                  pagerRef.current?.scrollToIndex({ index: tabIndex, animated: true });
                }}
                style={[styles.tab, isActive ? styles.activeTab : null]}
              >
                {/*
                  O nome pode encolher com ellipsis em telas estreitas, mas o
                  contador fica separado e não é sacrificado quando existem
                  três abas disputando a mesma largura.
                */}
                <View style={styles.tabLabelRow}>
                  <Text
                    style={[styles.tabText, isActive ? styles.activeTabText : null]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {tab.label}
                  </Text>
                  <Text style={[styles.tabCount, isActive ? styles.activeTabText : null]}>({tab.count})</Text>
                </View>
                <Animated.View
                  style={[
                    styles.tabIndicator,
                    {
                      opacity: availableTabs.length === 1
                        ? 1
                        : pagerScrollX.interpolate(
                          tabIndex === 0
                            ? { inputRange: [0, screenWidth], outputRange: [1, 0], extrapolate: 'clamp' }
                            : tabIndex === availableTabs.length - 1
                              ? { inputRange: [(tabIndex - 1) * screenWidth, tabIndex * screenWidth], outputRange: [0, 1], extrapolate: 'clamp' }
                              : { inputRange: [(tabIndex - 1) * screenWidth, tabIndex * screenWidth, (tabIndex + 1) * screenWidth], outputRange: [0, 1, 0], extrapolate: 'clamp' },
                        ),
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
      <Animated.FlatList
        /* O FlatList horizontal funciona como um pager leve: cada status
            dinâmico ocupa uma página e o gesto atualiza activeStatus no fim do
            movimento, mantendo o indicador e o conteúdo sincronizados. */
        ref={pagerRef}
        data={availableTabs}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: pagerScrollX } } }],
          { useNativeDriver: true },
        )}
        keyExtractor={(item) => item.status}
        getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
        onMomentumScrollEnd={(event) => {
          const pageIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
          const page = availableTabs[pageIndex];
          if (page && page.status !== activeStatus) setActiveStatus(page.status);
        }}
        renderItem={({ item: tab }) => {
          const pagePurchases = purchasesByStatus[tab.status] || [];
          return (
            <View style={[styles.pagerPage, { width: screenWidth }]}>
              <FlatList
                data={pagePurchases}
                keyExtractor={(item) => String(item.compra_id)}
                renderItem={renderPurchaseCard}
                contentContainerStyle={pagePurchases.length === 0 ? styles.emptyListContent : styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPurchases(true)} tintColor={COLORS.dashboardIconeBotaoCanto} />}
                ListEmptyComponent={<View style={styles.stateContainer}><Text style={styles.stateText}>Nenhuma compra nesta aba.</Text></View>}
                showsVerticalScrollIndicator={false}
              />
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
