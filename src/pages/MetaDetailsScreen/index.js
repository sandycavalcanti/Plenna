import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { concluirMeta } from '../../api/metas';
import { tokenStorage } from '../../api/tokenStorage';
import { useCofrinhoMetas } from '../../hooks/useCofrinhoMetas';
import { formatarValorMeta, valorMetaParaCentavos, normalizarValorMeta, formatarPercentualMeta } from '../../utils/metaMoney';
import { normalizarMetaRegistro } from '../../utils/metaContract';
import styles from './styles';

const PENDING_OPERATION_PREFIX = '@plenna/goal-savings/pending/';

function idDaMeta(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizarMeta(meta) {
  const normalized = normalizarMetaRegistro(meta);
  if (!normalized) return null;
  return {
    ...normalized,
    meta_id: idDaMeta(normalized.meta_id),
    meta_descricao: normalized.meta_descricao ?? '',
  };
}

function formatValue(value) {
  return formatarValorMeta(value) || 'Valor indisponível';
}

function formatMovementDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Data indisponível';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function movementType(value) {
  return value === 'RETIRADA' ? 'Retirada' : 'Depósito';
}

function userMessage(error) {
  if (error?.code === 'ROTA_NAO_ENCONTRADA') return 'A API publicada não possui a rota de movimentações do cofrinho. Atualize a API antes de tentar novamente.';
  if (error?.status === 404 && !error?.code) return 'A API respondeu 404 sem informar se a rota ou a meta não existe. Colete os detalhes HTTP para continuar o diagnóstico.';
  if (error?.code === 'SALDO_INSUFICIENTE' || error?.status === 422) return 'O valor da retirada é maior que o saldo reservado conhecido.';
  if (error?.code === 'META_NAO_ENCONTRADA') return 'Esta meta não foi encontrada ou não está mais disponível.';
  if (error?.status === 404) return 'A API respondeu 404 sem confirmar que a meta pertence ao usuário autenticado. Colete os detalhes HTTP para continuar o diagnóstico.';
  if (error?.code === 'OPERACAO_REUTILIZADA' || error?.status === 409) return 'Esta operação já foi usada com outros dados. Revise o valor e tente novamente.';
  if (error?.code === 'DADOS_INVALIDOS' || error?.status === 400) return 'Confira o valor informado e tente novamente.';
  if (error?.status === 401) return 'Sua sessão expirou. Entre novamente para continuar.';
  return 'Não foi possível confirmar a operação. Verifique sua conexão e tente novamente; o mesmo envio será reutilizado com segurança.';
}

function pendingKey(metaId, sessionScope) {
  return `${PENDING_OPERATION_PREFIX}${sessionScope}:${metaId}`;
}

export default function MetaDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const routeMeta = route.params?.meta ?? null;
  const metaId = idDaMeta(route.params?.metaId ?? routeMeta?.meta_id ?? routeMeta?.id);
  const {
    movimentacoes,
    refresh,
    loadMovements,
    prepare,
    deposit,
    withdraw,
  } = useCofrinhoMetas();
  const [meta, setMeta] = useState(() => normalizarMeta(routeMeta));
  const [refreshing, setRefreshing] = useState(false);
  const [metaError, setMetaError] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [completionError, setCompletionError] = useState(null);
  const [movementForm, setMovementForm] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingOperation, setPendingOperation] = useState(null);
  const [pendingLoaded, setPendingLoaded] = useState(false);
  const [pendingScope, setPendingScope] = useState(null);
  const historyLoadingRef = useRef(false);

  const movementState = movimentacoes[metaId] ?? { itens: [], nextCursor: null };

  useEffect(() => {
    let active = true;
    if (!metaId) return undefined;
    setPendingLoaded(false);
    tokenStorage.captureSession().then((session) => {
      if (active) setPendingScope(String(session?.id ?? 'anonymous'));
    }).catch(() => {
      if (active) setPendingScope('anonymous');
    });
    return () => { active = false; };
  }, [metaId]);

  useEffect(() => {
    let active = true;
    if (!metaId || pendingScope === null) return undefined;
    setPendingOperation(null);
    AsyncStorage.getItem(pendingKey(metaId, pendingScope)).then((value) => {
      if (!active || !value) return;
      try {
        const operation = JSON.parse(value);
        if (operation?.tipo && operation?.valor && operation?.operacao_id) setPendingOperation(operation);
      } catch {
        // Uma chave local inválida não deve impedir a consulta da meta.
      }
    }).catch(() => {
      // A operação em memória ainda pode ser reutilizada nesta montagem.
    }).finally(() => {
      if (active) setPendingLoaded(true);
    });
    return () => { active = false; };
  }, [metaId, pendingScope]);

  const loadHistoryPage = useCallback(async (cursor) => {
    if (!metaId || historyLoadingRef.current) return;
    historyLoadingRef.current = true;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      await loadMovements(metaId, { limit: 20, ...(cursor ? { cursor } : {}) });
    } catch (error) {
      setHistoryError(userMessage(error));
    } finally {
      historyLoadingRef.current = false;
      setHistoryLoading(false);
    }
  }, [metaId, loadMovements]);

  const loadHistory = useCallback(async (reset = false) => {
    const cursor = reset ? undefined : movementState.nextCursor;
    if (!reset && !cursor) return;
    await loadHistoryPage(cursor);
  }, [loadHistoryPage, movementState.nextCursor]);

  const refreshDetails = useCallback(async () => {
    if (!metaId) return;
    setRefreshing(true);
    setMetaError(null);
    try {
      const metas = await refresh();
      const nextMeta = metas.find((item) => idDaMeta(item.meta_id) === metaId);
      if (!nextMeta) {
        setMeta(null);
        setMetaError('Esta meta não foi encontrada ou não está mais disponível.');
      } else {
        setMeta(normalizarMeta(nextMeta));
        await loadHistoryPage(undefined);
      }
    } catch (error) {
      setMetaError(userMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, [metaId, loadHistoryPage, refresh]);

  useFocusEffect(useCallback(() => {
    refreshDetails();
  }, [refreshDetails]));

  const progressWidth = useMemo(() => {
    const value = Number(meta?.progresso_percentual);
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  }, [meta?.progresso_percentual]);

  const openMovement = useCallback((tipo) => {
    if (!pendingLoaded) {
      Alert.alert('Aguarde um instante', 'Estamos verificando se existe uma operação pendente para esta meta.');
      return;
    }
    if (pendingOperation && pendingOperation.tipo !== tipo) {
      Alert.alert('Operação pendente', 'Finalize ou tente novamente a operação pendente antes de iniciar outra movimentação.');
      return;
    }
    setFormError(null);
    setMovementForm({ tipo, valor: pendingOperation?.valor ?? '' });
  }, [pendingLoaded, pendingOperation]);

  const submitMovement = useCallback(async () => {
    if (!movementForm || submitting || !metaId) return;
    const normalized = normalizarValorMeta(movementForm.valor);
    if (!normalized.value) {
      setFormError(normalized.error);
      return;
    }
    if (movementForm.tipo === 'RETIRADA') {
      const reservedCents = valorMetaParaCentavos(meta?.meta_valor_reservado);
      if (reservedCents !== null && normalized.cents > reservedCents) {
        setFormError('O valor da retirada é maior que o saldo reservado conhecido.');
        return;
      }
    }

    const samePending = pendingOperation?.tipo === movementForm.tipo && pendingOperation?.valor === normalized.value;
    const operation = samePending ? pendingOperation : prepare(movementForm.tipo, normalized.value);
    setSubmitting(true);
    setFormError(null);
    try {
      if (pendingScope === null) throw new Error('PENDING_SCOPE_UNAVAILABLE');
      await AsyncStorage.setItem(pendingKey(metaId, pendingScope), JSON.stringify(operation));
      setPendingOperation(operation);
    } catch {
      setFormError('Não foi possível guardar a operação para um retry seguro. Tente novamente.');
      setSubmitting(false);
      return;
    }

    let response;
    try {
      response = movementForm.tipo === 'DEPOSITO'
        ? await deposit(metaId, operation)
        : await withdraw(metaId, operation);
    } catch (error) {
      setFormError(userMessage(error));
      setSubmitting(false);
      return;
    }

    if (response?.meta) setMeta((current) => normalizarMeta({ ...current, ...response.meta }));
    setMovementForm(null);
    setFormError(null);
    try {
      await AsyncStorage.removeItem(pendingKey(metaId, pendingScope));
      setPendingOperation(null);
    } catch {
      // Repetir o mesmo UUID continua seguro se a remoção local falhar.
    }
    await loadHistory(true);
    setSubmitting(false);
  }, [deposit, meta, metaId, loadHistory, movementForm, pendingOperation, pendingScope, prepare, submitting, withdraw]);

  const toggleCompletion = useCallback(async () => {
    if (!meta || completionLoading) return;
    setCompletionLoading(true);
    setCompletionError(null);
    try {
      await concluirMeta(metaId, !meta.meta_completado);
      setMeta((current) => ({ ...current, meta_completado: !current.meta_completado }));
    } catch {
      setCompletionError('Não foi possível atualizar o status da meta.');
    } finally {
      setCompletionLoading(false);
    }
  }, [completionLoading, meta, metaId]);

  const renderMovement = useCallback(({ item }) => {
    const deposit = item.meta_movimentacao_tipo === 'DEPOSITO';
    return (
      <View style={styles.movementItem}>
        <View style={[styles.movementIcon, deposit ? styles.depositIcon : styles.withdrawIcon]}>
          <MaterialCommunityIcons name={deposit ? 'arrow-down' : 'arrow-up'} size={18} color={deposit ? '#4F8D7A' : '#A31414'} />
        </View>
        <View style={styles.movementCopy}>
          <Text style={styles.movementType}>{movementType(item.meta_movimentacao_tipo)}</Text>
          <Text style={styles.movementDate}>{formatMovementDate(item.meta_movimentacao_data)}</Text>
        </View>
        <Text style={[styles.movementValue, deposit ? styles.depositValue : styles.withdrawValue]}>{deposit ? '+' : '-'} {formatValue(item.meta_movimentacao_valor)}</Text>
      </View>
    );
  }, []);

  const renderLatest = (label, movement) => movement ? (
    <View style={styles.latestBlock}>
      <Text style={styles.latestLabel}>{label}</Text>
      <Text style={styles.latestValue}>{movementType(movement.meta_movimentacao_tipo)} de {formatValue(movement.meta_movimentacao_valor)}</Text>
      <Text style={styles.latestDate}>{formatMovementDate(movement.meta_movimentacao_data)}</Text>
    </View>
  ) : null;

  const renderHeader = () => {
    if (!meta) return null;
    return (
      <>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color="#594367" />
          </Pressable>
          <View style={styles.topBarCopy}>
            <Text style={styles.eyebrow}>Cofrinho de metas</Text>
            <Text style={styles.title} numberOfLines={2}>{meta.meta_titulo}</Text>
          </View>
        </View>
        <View style={styles.card}>
          {meta.meta_descricao ? <Text style={styles.description}>{meta.meta_descricao}</Text> : null}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCell}><Text style={styles.summaryLabel}>Objetivo</Text><Text style={styles.summaryValue}>{formatValue(meta.meta_valor)}</Text></View>
            <View style={styles.summaryCell}><Text style={styles.summaryLabel}>Reservado agora</Text><Text style={[styles.summaryValue, styles.highlightValue]}>{formatValue(meta.meta_valor_reservado)}</Text></View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCell}><Text style={styles.summaryLabel}>Valor restante</Text><Text style={styles.summaryValue}>{formatValue(meta.valor_restante)}</Text></View>
            <View style={styles.summaryCell}><Text style={styles.summaryLabel}>Progresso</Text><Text style={[styles.summaryValue, styles.highlightValue]}>{formatarPercentualMeta(meta.progresso_percentual)}</Text></View>
          </View>
          <View accessible accessibilityLabel={`Barra de progresso: ${formatarPercentualMeta(meta.progresso_percentual)}`} style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progressWidth}%` }]} /></View>
          {renderLatest('Última movimentação', meta.ultima_movimentacao)}
          {renderLatest('Último depósito', meta.ultimo_deposito)}
          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Adicionar valor à meta" onPress={() => openMovement('DEPOSITO')} disabled={submitting} style={[styles.actionButton, styles.depositButton]}><Text style={styles.actionButtonText}>Adicionar valor</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Retirar valor da meta" onPress={() => openMovement('RETIRADA')} disabled={submitting} style={[styles.actionButton, styles.withdrawButton]}><Text style={[styles.actionButtonText, styles.withdrawButtonText]}>Retirar valor</Text></Pressable>
          </View>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: meta.meta_completado, disabled: completionLoading }} onPress={toggleCompletion} disabled={completionLoading} style={styles.completionButton}>
            <Text style={styles.completionText}>{meta.meta_completado ? 'Desmarcar como concluída' : 'Marcar como concluída'}</Text>
          </Pressable>
          {completionError ? <Text style={styles.formError}>{completionError}</Text> : null}
        </View>
        <View style={[styles.card, { marginBottom: 0 }]}><Text style={styles.sectionTitle}>Histórico de movimentações</Text></View>
      </>
    );
  };

  if (!metaId) {
    return <SafeAreaView style={styles.container}><View style={styles.state}><Text style={styles.stateText}>Não foi possível abrir esta meta.</Text><Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.retry}><Text style={styles.retryText}>Voltar</Text></Pressable></View></SafeAreaView>;
  }

  if (!meta && (refreshing || !metaError)) {
    return <SafeAreaView style={styles.container}><View style={styles.state}><ActivityIndicator accessibilityLabel="Carregando detalhes da meta" color="#893467" /><Text style={styles.stateText}>Carregando detalhes da meta...</Text></View></SafeAreaView>;
  }

  if (!meta) {
    return <SafeAreaView style={styles.container}><View style={styles.state}><Text style={styles.stateText}>{metaError}</Text><Pressable accessibilityRole="button" onPress={refreshDetails} style={styles.retry}><Text style={styles.retryText}>Tentar novamente</Text></Pressable></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={movementState.itens}
        keyExtractor={(item) => String(item.meta_movimentacao_id)}
        renderItem={renderMovement}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={historyLoading ? <View style={styles.state}><ActivityIndicator accessibilityLabel="Carregando histórico" color="#893467" /></View> : <View style={styles.state}><Text style={styles.stateText}>Ainda não há movimentações nesta meta.</Text><Text style={styles.stateText}>Adicione um valor quando quiser registrar seu progresso.</Text></View>}
        ListFooterComponent={historyError ? <View style={styles.footer}><Text style={styles.stateText}>{historyError}</Text><Pressable accessibilityRole="button" onPress={() => loadHistory(!movementState.itens.length)} style={styles.retry}><Text style={styles.retryText}>Tentar novamente</Text></Pressable></View> : historyLoading && movementState.itens.length > 0 ? <View style={styles.footer}><ActivityIndicator accessibilityLabel="Carregando mais movimentações" color="#893467" /></View> : movementState.nextCursor ? <View style={styles.footer}><Pressable accessibilityRole="button" onPress={() => loadHistory(false)} style={styles.retry}><Text style={styles.retryText}>Carregar mais</Text></Pressable></View> : movementState.itens.length > 0 ? <Text style={styles.footer}>Fim do histórico</Text> : null}
        onEndReached={() => loadHistory(false)}
        onEndReachedThreshold={0.4}
        refreshing={refreshing}
        onRefresh={refreshDetails}
      />
      <Modal transparent visible={Boolean(movementForm)} animationType="slide" onRequestClose={() => { if (!submitting) setMovementForm(null); }}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalOverlay} onPress={() => { if (!submitting) setMovementForm(null); }}>
            <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
              <Text style={styles.modalTitle}>{movementForm?.tipo === 'RETIRADA' ? 'Retirar valor' : 'Adicionar valor'}</Text>
              <Text style={styles.modalHint}>Esta é uma reserva simbólica para acompanhar a meta e não representa uma movimentação bancária.</Text>
              <Text style={styles.inputLabel}>Valor</Text>
              <TextInput accessibilityLabel="Valor da movimentação" value={movementForm?.valor ?? ''} onChangeText={(valor) => setMovementForm((current) => ({ ...current, valor }))} placeholder="Ex.: 150,00" keyboardType="decimal-pad" style={styles.input} editable={!submitting && !pendingOperation} autoFocus />
              {pendingOperation ? <Text style={styles.pendingHint}>Existe uma operação pendente. Se o resultado anterior ficou incerto, este envio reutilizará o mesmo identificador.</Text> : null}
              {formError ? <Text style={styles.formError}>{formError}</Text> : null}
              <View style={styles.modalActions}>
                <Pressable accessibilityRole="button" onPress={() => setMovementForm(null)} disabled={submitting} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={submitMovement} disabled={submitting} style={styles.submitButton}>{submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Confirmar</Text>}</Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

