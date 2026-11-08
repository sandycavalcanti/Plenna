import { presentationStyles } from "./styles";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, FlatList, Pressable, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import { logApiErrors } from '../../utils/error';
import PurchaseItem from '../../components/PurchaseComponents/PurchaseItem';
import ContextoCompra from '../../components/PurchaseComponents/ContextoCompra';
import { COLORS } from '../../constants/colors';
import { styles } from './styles';
import AppScreenHeader from '../../components/Common/AppScreenHeader';
import PinModal from '../../components/SecurityComponents/PinModal';
import { PROTECTED_ACCESS_STATES, useProtectedAccess } from '../../hooks/useProtectedAccess';
import { comprasPeriodo } from '../../utils/comprasPeriodo';
import { consultarResumosCompras } from '../../services/resumosCompras';
import GerenciarCompra from '../../components/PurchaseComponents/GerenciarCompra';
import FiltroTemporalCompras from '../../components/PurchaseComponents/FiltroTemporalCompras';
import PanoramaCompras from '../../components/PurchaseComponents/PanoramaCompras';
import { filtrosTemporaisIniciais, parametrosTemporaisCompras, referenciaInicioHistorico } from '../../utils/filtrosHistoricoCompras';

/**
 * Tela que apresenta todas as compras retornadas para o usuário autenticado.
 * A autenticação não é feita manualmente aqui: o interceptor do apiClient
 * adiciona o token existente em todas as requisições.
 */
export default function PurchasesScreen({
  route
} = {}) {
  const navigation = useNavigation();
  const filtroConsumo = route?.params?.filtroConsumo;
  const contextoNavegacao = useRef({
    filtroConsumo,
    navigation
  });
  contextoNavegacao.current = {
    filtroConsumo,
    navigation
  };
  const [filtros, setFiltros] = useState(filtrosTemporaisIniciais);
  const [criacaoConta, setCriacaoConta] = useState(null);
  const [metadataRevision, setMetadataRevision] = useState(0);
  const cursorRef = useRef(null);
  const [nextCursor, setNextCursor] = useState(null);
  useEffect(() => {
    if (filtroConsumo?.periodo) setFiltros({
      ...filtrosTemporaisIniciais(),
      modo: 'MES',
      mes: filtroConsumo.periodo
    });
  }, [filtroConsumo]);
  const [contextoCompraId, setContextoCompraId] = useState(null);
  const [gerenciamento, setGerenciamento] = useState(null),
    [resumos, setResumos] = useState({});
  const isFocused = useIsFocused();
  const protectedAccess = useProtectedAccess();
  const purchaseRequest = useRef(0);
  const purchaseAbort = useRef(null);
  const purchaseSessionDetach = useRef(() => {});
  useEffect(() => {
    if (!isFocused || protectedAccess.status !== PROTECTED_ACCESS_STATES.UNLOCKED) {
      purchaseRequest.current++;
      purchaseAbort.current?.abort();
      purchaseSessionDetach.current();
      setContextoCompraId(null);
      setGerenciamento(null);
      setCriacaoConta(null);
      setResumos({});
      setPurchases([]);
    }
  }, [isFocused, protectedAccess.status]);
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
  const [panoramaRevision, setPanoramaRevision] = useState(0);
  useEffect(() => {
    if (!isFocused || protectedAccess.status !== PROTECTED_ACCESS_STATES.UNLOCKED) return;
    const controller = new AbortController();
    let session, clear;
    (async () => {
      try {
        session = await tokenStorage.captureSession();
        if (!session || controller.signal.aborted) return;
        tokenStorage.assertSession(session.id);
        clear = () => {
          controller.abort();
          setCriacaoConta(null);
        };
        session.signal.addEventListener('abort', clear, {
          once: true
        });
        const response = await apiClient.get('/users/user', {
          signal: controller.signal,
          usageMonitoringSessionId: session.id
        });
        tokenStorage.assertSession(session.id);
        if (!controller.signal.aborted) setCriacaoConta(response.data?.usuario_data_criacao ?? null);
      } catch {/* O filtro permanece indisponível até recuperar os limites reais. */}
    })();
    return () => {
      controller.abort();
      session?.signal.removeEventListener('abort', clear);
    };
  }, [isFocused, protectedAccess.status, metadataRevision]);

  /**
   * Busca a lista em ordem cronológica, com paginação da API.
   * O erro fica separado da lista vazia para que os dois estados não sejam
   * apresentados como se fossem a mesma situação.
   */
  const loadPurchases = useCallback(async (isRefresh = false, append = false) => {
    if (!isFocused || protectedAccess.status !== PROTECTED_ACCESS_STATES.UNLOCKED) return;
    if (append && cursorRef.current === null) return;
    if (!append) setPanoramaRevision(value => value + 1);
    const requestId = ++purchaseRequest.current;
    purchaseAbort.current?.abort();
    purchaseSessionDetach.current();
    const controller = new AbortController();
    purchaseAbort.current = controller;
    let session, clear;
    if (isRefresh || append) setRefreshing(true);else setLoading(true);
    if (!append) {
      cursorRef.current = null;
      setNextCursor(null);
      setPurchases([]);
      setResumos({});
    }
    setErrorMessage(null);
    try {
      // GET /compras já usa o usuário do JWT no back-end.
      session = await tokenStorage.captureSession();
      if (!session) throw Error('SESSION_REQUIRED');
      tokenStorage.assertSession(session.id);
      if (requestId !== purchaseRequest.current || controller.signal.aborted) return;
      clear = () => {
        controller.abort();
        if (requestId === purchaseRequest.current) {
          setPurchases([]);
          setResumos({});
          setContextoCompraId(null);
          setGerenciamento(null);
          setErrorMessage('Sua sessão mudou. Entre novamente para consultar as compras.');
        }
      };
      session.signal.addEventListener('abort', clear, {
        once: true
      });
      purchaseSessionDetach.current = () => session.signal.removeEventListener('abort', clear);
      const params = parametrosTemporaisCompras(filtros);
      if (append) params.antes = cursorRef.current;
      const response = await apiClient.get('/compras/historico', {
        params,
        signal: controller.signal,
        usageMonitoringSessionId: session.id
      });
      tokenStorage.assertSession(session.id);
      if (requestId !== purchaseRequest.current || controller.signal.aborted) return;
      if (!Array.isArray(response.data?.compras) || response.data.compras.length > 50 || response.data.proximoCursor !== null && (!Number.isSafeInteger(response.data.proximoCursor) || response.data.proximoCursor <= 0)) throw Error('INVALID_PURCHASE_LIST');
      const eligiblePurchases = response.data.compras.filter(purchase => ['AGUARDANDO_CONFIRMACAO', 'CONFIRMADA', 'IGNORADA'].includes(purchase.compra_status));
      const summaries = await consultarResumosCompras(eligiblePurchases);
      tokenStorage.assertSession(session.id);
      if (requestId !== purchaseRequest.current || controller.signal.aborted) return;
      setResumos(previous => append ? {
        ...previous,
        ...summaries
      } : summaries);
      cursorRef.current = response.data.proximoCursor;
      setNextCursor(response.data.proximoCursor);
      const scoped = filtroConsumo ? comprasPeriodo(eligiblePurchases, filtroConsumo) : eligiblePurchases;
      const visible = scoped.filter(purchase => {
        const hidden = summaries[purchase.compra_id]?.oculto === true;
        return !hidden;
      });
      setPurchases(previous => sortPurchases(append ? [...new Map([...previous, ...visible].map(row => [row.compra_id, row])).values()] : visible));
    } catch (error) {
      if (requestId !== purchaseRequest.current || controller.signal.aborted) return;
      logApiErrors(error, 'Erro ao carregar compras');
      setErrorMessage('Não foi possível carregar suas compras. Tente novamente.');
    } finally {
      if (requestId === purchaseRequest.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [filtroConsumo, filtros, isFocused, protectedAccess.status]);

  /** Mesma ordem cronológica e desempate por ID usados pelo cursor da API. */
  function sortPurchases(list) {
    return [...list].sort((a, b) => Date.parse(b.compra_horario) - Date.parse(a.compra_horario) || b.compra_id - a.compra_id);
  }

  /**
   * Confirma uma compra pendente. O loading é por compra, então uma ação não
   * congela a lista inteira; em caso de erro o card não é alterado.
   */
  const handleConfirmPurchase = useCallback(async purchase => {
    if (statusActions[purchase.compra_id]) return;
    setStatusActions(current => ({
      ...current,
      [purchase.compra_id]: 'confirm'
    }));
    try {
      const response = await apiClient.post(`/compras/${purchase.compra_id}/confirm`, {});
      setPanoramaRevision(value => value + 1);
      const updatedPurchase = response.data?.compra || response.data;
      setPurchases(currentPurchases => sortPurchases(currentPurchases.map(item => item.compra_id === purchase.compra_id ? {
        ...item,
        ...updatedPurchase,
        compra_status: 'CONFIRMADA'
      } : item)));
      // O sucesso usa uma mensagem única e curta; a mudança visual da lista
      // continua sendo a confirmação principal da operação concluída.
      Alert.alert('Compra confirmada com sucesso!');
    } catch (error) {
      logApiErrors(error, 'Erro ao confirmar compra');
      Alert.alert('Erro', 'Não foi possível confirmar a compra. Tente novamente.');
    } finally {
      setStatusActions(current => {
        const next = {
          ...current
        };
        delete next[purchase.compra_id];
        return next;
      });
    }
  }, [statusActions]);

  /** A ação de ignorar só muda o status após o endpoint concluir com sucesso. */
  const handleIgnorePurchase = useCallback(async purchase => {
    if (statusActions[purchase.compra_id]) return;
    setStatusActions(current => ({
      ...current,
      [purchase.compra_id]: 'ignore'
    }));
    try {
      await apiClient.post(`/compras/${purchase.compra_id}/ignore`);
      setPanoramaRevision(value => value + 1);
      // Ignorada permanece no banco, mas sai imediatamente da única lista
      // visual porque esse status final não é uma página recuperável.
      setPurchases(currentPurchases => currentPurchases.filter(item => item.compra_id !== purchase.compra_id));
      Alert.alert('Compra ignorada', 'Ela continua registrada, mas não aparece nas listas de compras pendentes ou confirmadas.');
    } catch (error) {
      logApiErrors(error, 'Erro ao ignorar compra');
      Alert.alert('Erro', 'Não foi possível ignorar a compra. Tente novamente.');
    } finally {
      setStatusActions(current => {
        const next = {
          ...current
        };
        delete next[purchase.compra_id];
        return next;
      });
    }
  }, [statusActions]);

  /**
   * Recarrega ao entrar ou voltar para a tela, seguindo o padrão já usado na
   * Dashboard e garantindo dados atuais após retornar de outra tela.
   */
  useFocusEffect(useCallback(() => {
    // O foco apenas inicia o gate. A função loadPurchases só é disparada no
    // efeito abaixo depois que o gate informa status UNLOCKED, evitando que
    // GET /compras ou qualquer valor financeiro apareça antes da autenticação.
    // Cada foco representa uma nova visita à área financeira. O gate só
    // dispara GET /compras depois de uma autenticação local bem-sucedida.
    setFocusRevision(revision => revision + 1);
    protectedAccess.beginAccess();
    return () => {
      // Ao sair, a sessão em memória é invalidada e a lista é limpa para
      // impedir que valores financeiros permaneçam renderizáveis durante a
      // próxima entrada. Isso não é um re-render: é o encerramento real da
      // visita causado pela perda de foco da tela.
      protectedAccess.cancelAccess();
      purchaseRequest.current++;
      purchaseAbort.current?.abort();
      purchaseSessionDetach.current();
      setPurchases([]);
      setLoading(true);
      setErrorMessage(null);
      setStatusActions({});
      cursorRef.current = null;
      setNextCursor(null);
      if (contextoNavegacao.current.filtroConsumo) {
        setFiltros(filtrosTemporaisIniciais());
      }
      if (contextoNavegacao.current.filtroConsumo) contextoNavegacao.current.navigation.setParams?.({
        filtroConsumo: undefined
      });
    };
  }, [protectedAccess.beginAccess, protectedAccess.cancelAccess]));
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
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
  const handleDeletePurchase = useCallback(async purchase => {
    const purchaseId = purchase.compra_id;
    setDeletingId(purchaseId);
    try {
      // O interceptor adiciona a autenticação; nenhum token é manipulado aqui.
      await apiClient.delete(`/compras/${purchaseId}`);
      setPanoramaRevision(value => value + 1);

      // Atualização otimista é evitada: só filtramos após o sucesso da API.
      setPurchases(currentPurchases => currentPurchases.filter(item => item.compra_id !== purchaseId));
      Alert.alert('Compra excluída', 'Ela saiu do histórico e não participa mais dos totais financeiros.');
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
      setPanoramaRevision(value => value + 1);

      // Substituímos somente a compra afetada para preservar a ordem da lista.
      setPurchases(currentPurchases => currentPurchases.map(currentPurchase => currentPurchase.compra_id === purchaseId ? response.data : currentPurchase));
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
    const message = protectedAccess.status === PROTECTED_ACCESS_STATES.ERROR ? protectedAccess.errorMessage : protectedAccess.status === PROTECTED_ACCESS_STATES.BIOMETRIC ? 'Confirme sua identidade no aviso do aparelho.' : protectedAccess.status === PROTECTED_ACCESS_STATES.LOCKOUT ? protectedAccess.errorMessage : 'Suas compras ficam protegidas por uma confirmação local.';
    return <SafeAreaView style={styles.container} edges={['top']}>
        <AppScreenHeader icon="shield-lock-outline" title="Minhas compras" subtitle="Confirmação necessária para continuar" />
        <View style={styles.stateContainer}>
          {isBusy ? <ActivityIndicator size="large" color={COLORS.dashboardIconeBotaoCanto} /> : null}
          <Text style={styles.stateText}>{message}</Text>
          {protectedAccess.status === PROTECTED_ACCESS_STATES.BIOMETRIC ? <TouchableOpacity style={styles.retryButton} onPress={protectedAccess.usePinFallback}>
              <Text style={styles.retryButtonText}>Usar PIN</Text>
            </TouchableOpacity> : null}
          {protectedAccess.status === PROTECTED_ACCESS_STATES.ERROR ? <TouchableOpacity style={styles.retryButton} onPress={protectedAccess.beginAccess}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity> : null}
        </View>
        <PinModal visible={protectedAccess.status === PROTECTED_ACCESS_STATES.SETUP || protectedAccess.status === PROTECTED_ACCESS_STATES.PIN} mode={protectedAccess.status === PROTECTED_ACCESS_STATES.SETUP ? 'setup' : 'unlock'} errorMessage={protectedAccess.errorMessage} onSubmit={protectedAccess.status === PROTECTED_ACCESS_STATES.SETUP ? protectedAccess.completeSetup : protectedAccess.submitPin} onCancel={protectedAccess.cancelAccess} />
      </SafeAreaView>;
  }
  function renderPurchaseCard({
    item
  }) {
    return <PurchaseItem purchase={item} onContext={item.compra_status === 'IGNORADA' ? undefined : setContextoCompraId} onManage={(compra, item) => setGerenciamento({
      compra,
      item
    })} resumo={resumos[item.compra_id]} isDeleting={deletingId === item.compra_id} hasItemDeleting={deletingItemId !== null} isItemDeleting={deletingItemId !== null && item.tb_compra_item?.some(purchaseItem => purchaseItem.compra_item_id === deletingItemId)} isStatusActionRunning={Boolean(statusActions[item.compra_id])} statusAction={statusActions[item.compra_id]} onConfirm={handleConfirmPurchase} onIgnore={handleIgnorePurchase} onDelete={handleDeletePurchase} onDeleteItem={purchaseItem => handleDeleteItem(item, purchaseItem)} />;
  }

  // Enquanto qualquer autenticação está pendente, nenhum componente que
  // renderiza compras é montado. Isso cobre navegação direta, retorno do
  // background e abertura da tela por qualquer outro chamador.
  if (protectedAccess.status !== PROTECTED_ACCESS_STATES.UNLOCKED) {
    return renderSecurityState();
  }
  return <SafeAreaView style={styles.container} edges={['top']}>
      <AppScreenHeader
        icon="shopping-outline"
        title="Minhas compras"
        subtitle="Acompanhe e organize suas compras"
        rightAction={<TouchableOpacity style={styles.headerAction} onPress={() => navigation.navigate('Recurrences')} accessibilityRole="button" accessibilityLabel="Abrir recorrências"><MaterialCommunityIcons name="autorenew" size={20} color={COLORS.cadTitulo} /></TouchableOpacity>}
      />

      {filtroConsumo && <View style={styles.analysisFilterBanner}>
        <MaterialCommunityIcons name="filter-variant" size={18} color={COLORS.cadTitulo} />
        <Text style={styles.analysisFilterTitle}>Filtros de análise ativos</Text>
        <Pressable accessibilityRole="button" style={styles.analysisFilterAction} onPress={() => {
        navigation.setParams({
          filtroConsumo: undefined
        });
        setFiltros(filtrosTemporaisIniciais());
      }}>
          <Text style={styles.analysisFilterActionText}>Ver todas</Text>
        </Pressable>
      </View>}
      <FlatList data={purchases} keyExtractor={item => String(item.compra_id)} renderItem={renderPurchaseCard} ListHeaderComponent={<>
          <FiltroTemporalCompras filtros={filtros} inicioHistorico={referenciaInicioHistorico(criacaoConta)} onRetry={() => setMetadataRevision(value => value + 1)} onChange={next => {
        if (filtroConsumo) navigation.setParams({
          filtroConsumo: undefined
        });
        setFiltros(next);
      }} />
          {!filtroConsumo && <PanoramaCompras filtros={filtros} active={isFocused && protectedAccess.status === PROTECTED_ACCESS_STATES.UNLOCKED && !contextoCompraId && !gerenciamento} refreshKey={panoramaRevision} />}
        </>} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPurchases(true)} tintColor={COLORS.dashboardIconeBotaoCanto} />} ListEmptyComponent={loading ? <View style={styles.loadingState}><ActivityIndicator accessibilityLabel="Carregando compras" color={COLORS.dashboardIconeBotaoCanto} /></View> : !errorMessage && <View style={styles.stateContainer}><Text style={styles.stateText}>{nextCursor ? 'Nenhuma compra visível nesta página.' : 'Nenhuma compra neste período.'}</Text></View>} ListFooterComponent={<>
          {errorMessage && <View style={styles.stateContainer}><Text accessibilityRole="alert" style={styles.stateText}>{errorMessage}</Text>
            <Pressable accessibilityRole="button" style={styles.retryButton} onPress={() => loadPurchases(false, nextCursor !== null)}><Text style={styles.retryButtonText}>Tentar novamente</Text></Pressable></View>}
          {nextCursor && !errorMessage ? <Pressable accessibilityRole="button" disabled={refreshing || loading} onPress={() => loadPurchases(false, true)} style={presentationStyles.inline4}><Text style={{
          color: COLORS.cadTitulo
        }}>{refreshing ? 'Carregando…' : 'Carregar mais compras'}</Text></Pressable> : null}
        </>} showsVerticalScrollIndicator={false} />
      {gerenciamento && <GerenciarCompra {...gerenciamento} onClose={() => setGerenciamento(null)} onSaved={() => loadPurchases(true)} />}
      {contextoCompraId !== null && <ContextoCompra etapaInicial="compra" revisaoInicial={resumos[contextoCompraId]?.contextoRevisao} compraId={contextoCompraId} compra={(() => {
      const c = purchases.find(c => c.compra_id === contextoCompraId);
      return c ? {
        ...c,
        tb_compra_item: c.tb_compra_item?.filter(i => !resumos[c.compra_id]?.itensOcultos?.includes(i.compra_item_id))
      } : undefined;
    })()} onClose={() => {
      setContextoCompraId(null);
      loadPurchases(true);
    }} />}
    </SafeAreaView>;
}
