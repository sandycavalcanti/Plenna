import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkGoal } from '../../api/goals';
import { tokenStorage } from '../../api/tokenStorage';
import { formatarValorMoedaParaTela } from '../../components/CustomTextInput/currency';
import { useGoalSavings } from '../../hooks/useGoalSavings';
import { goalMoneyToCents, normalizeGoalMoney, formatGoalPercent } from '../../utils/goalMoney';
import styles from './styles';

const PENDING_OPERATION_PREFIX = '@plenna/goal-savings/pending/';

function goalIdFrom(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeGoal(goal) {
  if (!goal) return null;
  return {
    ...goal,
    meta_id: goalIdFrom(goal.meta_id ?? goal.id),
    meta_titulo: goal.meta_titulo ?? goal.nome ?? 'Meta',
    meta_descricao: goal.meta_descricao ?? goal.descricao ?? '',
    meta_valor: goal.meta_valor ?? goal.valor,
    meta_valor_reservado: goal.meta_valor_reservado ?? goal.valorReservado,
    progresso_percentual: goal.progresso_percentual ?? goal.progressoPercentual,
    valor_restante: goal.valor_restante ?? goal.valorRestante,
    meta_completado: goal.meta_completado ?? goal.concluida === true,
  };
}

function formatValue(value) {
  return formatarValorMoedaParaTela(value) || 'R$ 0,00';
}

function formatMovementDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Data indisponível';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function movementType(value) {
  return value === 'RETIRADA' ? 'Retirada' : 'Depósito';
}

function userMessage(error) {
  if (error?.code === 'SALDO_INSUFICIENTE' || error?.status === 422) return 'O valor da retirada é maior que o saldo reservado conhecido.';
  if (error?.code === 'META_NAO_ENCONTRADA' || error?.status === 404) return 'Esta meta não foi encontrada ou não está mais disponível.';
  if (error?.code === 'OPERACAO_REUTILIZADA' || error?.status === 409) return 'Esta operação já foi usada com outros dados. Revise o valor e tente novamente.';
  if (error?.code === 'DADOS_INVALIDOS' || error?.status === 400) return 'Confira o valor informado e tente novamente.';
  if (error?.status === 401) return 'Sua sessão expirou. Entre novamente para continuar.';
  return 'Não foi possível confirmar a operação. Verifique sua conexão e tente novamente; o mesmo envio será reutilizado com segurança.';
}

function pendingKey(metaId, sessionScope) {
  return `${PENDING_OPERATION_PREFIX}${sessionScope}:${metaId}`;
}

export default function GoalDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const routeGoal = route.params?.goal ?? null;
  const goalId = goalIdFrom(route.params?.goalId ?? route.params?.meta_id ?? routeGoal?.meta_id ?? routeGoal?.id);
  const {
    movimentacoes,
    refresh,
    loadMovements,
    prepare,
    deposit,
    withdraw,
  } = useGoalSavings();
  const [goal, setGoal] = useState(() => normalizeGoal(routeGoal));
  const [refreshing, setRefreshing] = useState(false);
  const [goalError, setGoalError] = useState(null);
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

  const movementState = movimentacoes[goalId] ?? { itens: [], nextCursor: null };

  useEffect(() => {
    let active = true;
    if (!goalId) return undefined;
    setPendingLoaded(false);
    tokenStorage.captureSession().then((session) => {
      if (active) setPendingScope(String(session?.id ?? 'anonymous'));
    }).catch(() => {
      if (active) setPendingScope('anonymous');
    });
    return () => { active = false; };
  }, [goalId]);

  useEffect(() => {
    let active = true;
    if (!goalId || pendingScope === null) return undefined;
    setPendingOperation(null);
    AsyncStorage.getItem(pendingKey(goalId, pendingScope)).then((value) => {
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
  }, [goalId, pendingScope]);

  const loadHistoryPage = useCallback(async (cursor) => {
    if (!goalId || historyLoadingRef.current) return;
    historyLoadingRef.current = true;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      await loadMovements(goalId, { limit: 20, ...(cursor ? { cursor } : {}) });
    } catch (error) {
      setHistoryError(userMessage(error));
    } finally {
      historyLoadingRef.current = false;
      setHistoryLoading(false);
    }
  }, [goalId, loadMovements]);

  const loadHistory = useCallback(async (reset = false) => {
    const cursor = reset ? undefined : movementState.nextCursor;
    if (!reset && !cursor) return;
    await loadHistoryPage(cursor);
  }, [loadHistoryPage, movementState.nextCursor]);

  const refreshDetails = useCallback(async () => {
    if (!goalId) return;
    setRefreshing(true);
    setGoalError(null);
    try {
      const goals = await refresh();
      const nextGoal = goals.find((item) => goalIdFrom(item.meta_id) === goalId);
      if (!nextGoal) {
        setGoal(null);
        setGoalError('Esta meta não foi encontrada ou não está mais disponível.');
      } else {
        setGoal(normalizeGoal(nextGoal));
        await loadHistoryPage(undefined);
      }
    } catch (error) {
      setGoalError(userMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, [goalId, loadHistoryPage, refresh]);

  useFocusEffect(useCallback(() => {
    refreshDetails();
  }, [refreshDetails]));

  const progressWidth = useMemo(() => {
    const value = Number(goal?.progresso_percentual);
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  }, [goal?.progresso_percentual]);

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
    if (!movementForm || submitting || !goalId) return;
    const normalized = normalizeGoalMoney(movementForm.valor);
    if (!normalized.value) {
      setFormError(normalized.error);
      return;
    }
    if (movementForm.tipo === 'RETIRADA') {
      const reservedCents = goalMoneyToCents(goal?.meta_valor_reservado);
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
      await AsyncStorage.setItem(pendingKey(goalId, pendingScope), JSON.stringify(operation));
      setPendingOperation(operation);
    } catch {
      setFormError('Não foi possível guardar a operação para um retry seguro. Tente novamente.');
      setSubmitting(false);
      return;
    }

    let response;
    try {
      response = movementForm.tipo === 'DEPOSITO'
        ? await deposit(goalId, operation)
        : await withdraw(goalId, operation);
    } catch (error) {
      setFormError(userMessage(error));
      setSubmitting(false);
      return;
    }

    if (response?.meta) setGoal((current) => normalizeGoal({ ...current, ...response.meta }));
    setMovementForm(null);
    setFormError(null);
    try {
      await AsyncStorage.removeItem(pendingKey(goalId, pendingScope));
      setPendingOperation(null);
    } catch {
      // Repetir o mesmo UUID continua seguro se a remoção local falhar.
    }
    await loadHistory(true);
    setSubmitting(false);
  }, [deposit, goal, goalId, loadHistory, movementForm, pendingOperation, pendingScope, prepare, submitting, withdraw]);

  const toggleCompletion = useCallback(async () => {
    if (!goal || completionLoading) return;
    setCompletionLoading(true);
    setCompletionError(null);
    try {
      await checkGoal(goalId, !goal.meta_completado);
      setGoal((current) => ({ ...current, meta_completado: !current.meta_completado }));
    } catch {
      setCompletionError('Não foi possível atualizar o status da meta.');
    } finally {
      setCompletionLoading(false);
    }
  }, [completionLoading, goal, goalId]);

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
    if (!goal) return null;
    return (
      <>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color="#594367" />
          </Pressable>
          <View style={styles.topBarCopy}>
            <Text style={styles.eyebrow}>Cofrinho de metas</Text>
            <Text style={styles.title} numberOfLines={2}>{goal.meta_titulo}</Text>
          </View>
        </View>
        <View style={styles.card}>
          {goal.meta_descricao ? <Text style={styles.description}>{goal.meta_descricao}</Text> : null}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCell}><Text style={styles.summaryLabel}>Objetivo</Text><Text style={styles.summaryValue}>{formatValue(goal.meta_valor)}</Text></View>
            <View style={styles.summaryCell}><Text style={styles.summaryLabel}>Reservado agora</Text><Text style={[styles.summaryValue, styles.highlightValue]}>{formatValue(goal.meta_valor_reservado)}</Text></View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCell}><Text style={styles.summaryLabel}>Valor restante</Text><Text style={styles.summaryValue}>{formatValue(goal.valor_restante)}</Text></View>
            <View style={styles.summaryCell}><Text style={styles.summaryLabel}>Progresso</Text><Text style={[styles.summaryValue, styles.highlightValue]}>{formatGoalPercent(goal.progresso_percentual)}</Text></View>
          </View>
          <View accessible accessibilityLabel={`Barra de progresso: ${formatGoalPercent(goal.progresso_percentual)}`} style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progressWidth}%` }]} /></View>
          {renderLatest('Última movimentação', goal.ultima_movimentacao)}
          {renderLatest('Último depósito', goal.ultimo_deposito)}
          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Adicionar valor à meta" onPress={() => openMovement('DEPOSITO')} disabled={submitting} style={[styles.actionButton, styles.depositButton]}><Text style={styles.actionButtonText}>Adicionar valor</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Retirar valor da meta" onPress={() => openMovement('RETIRADA')} disabled={submitting} style={[styles.actionButton, styles.withdrawButton]}><Text style={[styles.actionButtonText, styles.withdrawButtonText]}>Retirar valor</Text></Pressable>
          </View>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: goal.meta_completado, disabled: completionLoading }} onPress={toggleCompletion} disabled={completionLoading} style={styles.completionButton}>
            <Text style={styles.completionText}>{goal.meta_completado ? 'Desmarcar como concluída' : 'Marcar como concluída'}</Text>
          </Pressable>
          {completionError ? <Text style={styles.formError}>{completionError}</Text> : null}
        </View>
        <View style={[styles.card, { marginBottom: 0 }]}><Text style={styles.sectionTitle}>Histórico de movimentações</Text></View>
      </>
    );
  };

  if (!goalId) {
    return <SafeAreaView style={styles.container}><View style={styles.state}><Text style={styles.stateText}>Não foi possível abrir esta meta.</Text><Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.retry}><Text style={styles.retryText}>Voltar</Text></Pressable></View></SafeAreaView>;
  }

  if (!goal && (refreshing || !goalError)) {
    return <SafeAreaView style={styles.container}><View style={styles.state}><ActivityIndicator accessibilityLabel="Carregando detalhes da meta" color="#893467" /><Text style={styles.stateText}>Carregando detalhes da meta...</Text></View></SafeAreaView>;
  }

  if (!goal) {
    return <SafeAreaView style={styles.container}><View style={styles.state}><Text style={styles.stateText}>{goalError}</Text><Pressable accessibilityRole="button" onPress={refreshDetails} style={styles.retry}><Text style={styles.retryText}>Tentar novamente</Text></Pressable></View></SafeAreaView>;
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

