import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { atualizarMeta, concluirMeta, excluirMeta } from '../../api/metas';
import { tokenStorage } from '../../api/tokenStorage';
import { useCofrinhoMetas } from '../../hooks/useCofrinhoMetas';
import { formatarValorMeta, valorMetaParaCentavos, normalizarValorMeta, formatarPercentualMeta } from '../../utils/metaMoney';
import { normalizarMetaRegistro } from '../../utils/metaContract';
import { COLORS } from '../../constants';
import AppScreenHeader from '../../components/Common/AppScreenHeader';
import MetaFormSheet from '../../components/Metas/MetaFormSheet';
import CustomButton from '../../components/CustomButton';
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
  const [metaFormVisible, setMetaFormVisible] = useState(false);
  const [metaFormError, setMetaFormError] = useState(null);
  const [metaFormSaving, setMetaFormSaving] = useState(false);
  const [metaDeleting, setMetaDeleting] = useState(false);
  const [movementForm, setMovementForm] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingOperation, setPendingOperation] = useState(null);
  const [pendingLoaded, setPendingLoaded] = useState(false);
  const [pendingLoadError, setPendingLoadError] = useState(false);
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
    setPendingLoadError(false);
    AsyncStorage.getItem(pendingKey(metaId, pendingScope)).then((value) => {
      if (!active || !value) return;
      try {
        const operation = JSON.parse(value);
        if (operation?.tipo && operation?.valor && operation?.operacao_id) setPendingOperation(operation);
      } catch {
        // Uma chave local inválida não deve impedir a consulta da meta.
      }
    }).catch(() => {
      if (active) setPendingLoadError(true);
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
    if (pendingLoadError) {
      Alert.alert('Não foi possível verificar a operação', 'Tente novamente antes de excluir a meta, para preservar qualquer operação pendente.');
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

  const openEdit = useCallback(() => {
    if (!meta || metaFormSaving || metaDeleting) return;
    setMetaFormError(null);
    setMetaFormVisible(true);
  }, [meta, metaDeleting, metaFormSaving]);

  const saveMetaForm = useCallback(async (data) => {
    if (!metaId || metaFormSaving || metaDeleting) return;
    setMetaFormSaving(true);
    setMetaFormError(null);
    try {
      await atualizarMeta(metaId, data);
      await refreshDetails();
      setMetaFormVisible(false);
    } catch (error) {
      setMetaFormError(error?.response?.data?.message || 'Não foi possível salvar as alterações da meta.');
      throw error;
    } finally {
      setMetaFormSaving(false);
    }
  }, [metaDeleting, metaFormSaving, metaId, refreshDetails]);

  const confirmDeleteMeta = useCallback(() => {
    if (!metaId || metaDeleting || metaFormSaving) return;
    if (!pendingLoaded) {
      Alert.alert('Aguarde um instante', 'Estamos verificando se existe uma operação pendente para esta meta.');
      return;
    }
    if (pendingLoadError) {
      Alert.alert('Não foi possível verificar a operação', 'Tente novamente antes de excluir a meta, para preservar qualquer operação pendente.');
      return;
    }
    if (pendingOperation) {
      Alert.alert('Operação pendente', 'Resolva a operação pendente antes de excluir esta meta.');
      return;
    }

    Alert.alert(
      'Excluir meta?',
      'Essa ação remove a meta e o histórico associado. Não será possível desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setMetaDeleting(true);
            setMetaFormError(null);
            try {
              await excluirMeta(metaId);
              setMetaFormVisible(false);
              navigation.goBack();
            } catch (error) {
              setMetaFormError(error?.response?.data?.message || 'Não foi possível excluir a meta.');
            } finally {
              setMetaDeleting(false);
            }
          },
        },
      ],
    );
  }, [metaDeleting, metaFormSaving, metaId, navigation, pendingLoadError, pendingLoaded, pendingOperation]);

  const renderMovement = useCallback(({ item }) => {
    const deposit = item.meta_movimentacao_tipo === 'DEPOSITO';
    return (
      <View style={styles.movementItem}>
        <View style={[styles.movementIcon, deposit ? styles.depositIcon : styles.withdrawIcon]}>
          <MaterialCommunityIcons name={deposit ? 'arrow-down' : 'arrow-up'} size={18} color={deposit ? COLORS.buttonPositiveText : COLORS.buttonDangerText} />
        </View>
        <View style={styles.movementCopy}>
          <Text style={styles.movementType}>{movementType(item.meta_movimentacao_tipo)}</Text>
          <Text style={styles.movementDate}>{formatMovementDate(item.meta_movimentacao_data)}</Text>
        </View>
        <Text style={[styles.movementValue, deposit ? styles.depositValue : styles.withdrawValue]}>{deposit ? '+' : '-'} {formatValue(item.meta_movimentacao_valor)}</Text>
      </View>
    );
  }, []);

  const renderHeader = () => {
    if (!meta) return null;
    return (
      <>
        <AppScreenHeader
          icon="target"
          title={meta.meta_titulo}
          subtitle="Cofrinho de metas"
          showBackButton
          onBackPress={() => navigation.goBack()}
          rightAction={(
            <CustomButton accessibilityLabel="Editar meta" variant="ghost" icon="pencil-outline" iconOnly onPress={openEdit} disabled={metaFormSaving || metaDeleting} style={styles.editButton} />
          )}
          style={styles.screenHeader}
        />
        <View style={styles.card}>
          <View style={styles.summaryIntro}>
            <View style={styles.summaryIcon}>
              <MaterialCommunityIcons name="target" size={22} color={COLORS.buttonPrimaryBackground} />
            </View>
            <View style={styles.summaryIntroCopy}>
              <Text style={styles.summaryKicker}>{meta.meta_completado ? 'Meta concluída' : 'Em acompanhamento'}</Text>
              <Text style={styles.summaryHint}>Uma reserva simbólica para acompanhar seu objetivo.</Text>
            </View>
          </View>
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
          <View style={styles.actionRow}>
            <CustomButton title="Adicionar valor" accessibilityLabel="Adicionar valor à meta" variant="primary" onPress={() => openMovement('DEPOSITO')} disabled={submitting} style={styles.actionButton} />
            <CustomButton title="Retirar valor" accessibilityLabel="Retirar valor da meta" variant="secondary" onPress={() => openMovement('RETIRADA')} disabled={submitting} style={styles.actionButton} />
          </View>
          <CustomButton
            title={meta.meta_completado ? 'Desmarcar como concluída' : 'Marcar como concluída'}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: meta.meta_completado }}
            variant="outline"
            onPress={toggleCompletion}
            disabled={completionLoading}
            loading={completionLoading}
            fullWidth
            style={styles.completionButton}
          />
          {completionError ? <Text style={styles.formError}>{completionError}</Text> : null}
        </View>
        <View style={styles.historySectionHeader}><Text style={styles.sectionTitle}>Histórico de movimentações</Text><Text style={styles.sectionHint}>Acompanhe os valores adicionados e retirados desta meta.</Text></View>
      </>
    );
  };

  if (!metaId) {
    return <SafeAreaView style={styles.container}><View style={styles.state}><Text style={styles.stateText}>Não foi possível abrir esta meta.</Text><CustomButton title="Voltar" variant="secondary" onPress={() => navigation.goBack()} style={styles.retryButton} /></View></SafeAreaView>;
  }

  if (!meta && (refreshing || !metaError)) {
    return <SafeAreaView style={styles.container}><View style={styles.state}><ActivityIndicator accessibilityLabel="Carregando detalhes da meta" color={COLORS.buttonPrimaryBackground} /><Text style={styles.stateText}>Carregando detalhes da meta...</Text></View></SafeAreaView>;
  }

  if (!meta) {
    return <SafeAreaView style={styles.container}><View style={styles.state}><Text style={styles.stateText}>{metaError}</Text><CustomButton title="Tentar novamente" variant="outline" onPress={refreshDetails} style={styles.retryButton} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={movementState.itens}
        keyExtractor={(item) => String(item.meta_movimentacao_id)}
        renderItem={renderMovement}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={historyLoading ? <View style={styles.historyEmpty}><ActivityIndicator accessibilityLabel="Carregando histórico" color={COLORS.buttonPrimaryBackground} /></View> : <View style={styles.historyEmpty}><Text style={styles.stateText}>Nenhuma movimentação registrada ainda.</Text></View>}
        ListFooterComponent={historyError ? <View style={styles.footer}><Text style={styles.stateText}>{historyError}</Text><CustomButton title="Tentar novamente" variant="outline" onPress={() => loadHistory(!movementState.itens.length)} style={styles.retryButton} /></View> : historyLoading && movementState.itens.length > 0 ? <View style={styles.footer}><ActivityIndicator accessibilityLabel="Carregando mais movimentações" color={COLORS.buttonPrimaryBackground} /></View> : movementState.nextCursor ? <View style={styles.footer}><CustomButton title="Carregar mais" variant="secondary" onPress={() => loadHistory(false)} style={styles.retryButton} /></View> : null}
        onEndReached={() => loadHistory(false)}
        onEndReachedThreshold={0.4}
        refreshing={refreshing}
        onRefresh={refreshDetails}
      />
      <MetaFormSheet
        visible={metaFormVisible}
        mode="edit"
        meta={meta}
        onClose={() => { if (!metaFormSaving && !metaDeleting) setMetaFormVisible(false); }}
        onSubmit={saveMetaForm}
        onDelete={confirmDeleteMeta}
        saving={metaFormSaving}
        deleting={metaDeleting}
        error={metaFormError}
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
                <CustomButton title="Cancelar" variant="secondary" onPress={() => setMovementForm(null)} disabled={submitting} style={styles.modalActionButton} />
                <CustomButton title="Confirmar" variant="primary" onPress={submitMovement} loading={submitting} disabled={submitting} style={styles.modalActionButton} />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

