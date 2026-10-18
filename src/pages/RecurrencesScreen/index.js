import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../api/client';
import { logApiErrors } from '../../utils/error';
import { COLORS } from '../../constants/colors';
import { RECURRENCE_FREQUENCIES } from '../../utils/recurrencePreview';
import CustomTextInput from '../../components/CustomTextInput';
import { valorMoedaParaNumero } from '../../components/CustomTextInput/currency';
import PinModal from '../../components/SecurityComponents/PinModal';
import { PROTECTED_ACCESS_STATES, useProtectedAccess } from '../../hooks/useProtectedAccess';
import { styles } from './styles';

const STATUS_LABELS = {
  ATIVA: 'Ativa',
  PAUSADA: 'Pausada',
  CANCELADA: 'Cancelada',
  FINALIZADA: 'Finalizada',
};

const FREQUENCY_LABELS = RECURRENCE_FREQUENCIES.reduce((labels, frequency) => {
  labels[frequency.value] = frequency.label;
  return labels;
}, {});

function parseDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12);
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return date.getFullYear() === Number(match[1])
    && date.getMonth() === Number(match[2]) - 1
    && date.getDate() === Number(match[3])
    ? date
    : null;
}

function formatDateOnly(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDate(value) {
  const date = parseDateOnly(value);
  return date
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date)
    : 'Não informado';
}

function formatMoney(value) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatEditorMoney(value) {
  const number = Number(value);
  return Number.isFinite(number) ? String(Math.round(number * 100)) : '';
}

function startOfLocalMonth(date) {
  const value = new Date(date);
  value.setHours(12, 0, 0, 0);
  value.setDate(1);
  return value;
}

function getCalendarDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1, 12)),
  ];
}

function isSameLocalDate(left, right) {
  return Boolean(left && right)
    && left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.recorrencias)) return data.recorrencias;
  return [];
}

function getApiMessage(error, fallback) {
  const message = error?.response?.data?.message || error?.response?.data?.error;
  if (typeof message === 'string' && message.trim()) return message;
  if (error?.response?.status === 409) return 'Esta recorrência não pode ser alterada neste estado.';
  if (error?.response?.status === 401) return 'Sua sessão expirou. Entre novamente para continuar.';
  return fallback;
}

function getTotal(recurrence) {
  return (recurrence?.itens || []).reduce((total, item) => total + (Number(item.valor) || 0), 0);
}

function statusStyles(status) {
  if (status === 'ATIVA') return [styles.statusActive, styles.statusActiveText];
  if (status === 'PAUSADA') return [styles.statusPaused, styles.statusPausedText];
  if (status === 'CANCELADA') return [styles.statusCancelled, styles.statusCancelledText];
  return [styles.statusFinished, styles.statusFinishedText];
}

function toEditorState(recurrence) {
  return {
    id: recurrence.id,
    formaPagamentoId: recurrence.formaPagamentoId,
    compraFonte: recurrence.compraFonte || '',
    frequencia: recurrence.frequencia,
    primeiraOcorrencia: recurrence.primeiraOcorrencia,
    dataFinal: recurrence.dataFinal || null,
    itens: (recurrence.itens || []).map((item) => ({
      categoriaId: item.categoriaId,
      nome: item.nome || '',
      valor: formatEditorMoney(item.valor),
    })),
  };
}

export default function RecurrencesScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const protectedAccess = useProtectedAccess();
  const [recurrences, setRecurrences] = useState([]);
  const [detailsById, setDetailsById] = useState({});
  const [upcomingById, setUpcomingById] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [upcomingLoadingId, setUpcomingLoadingId] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [editor, setEditor] = useState(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryIndex, setCategoryIndex] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState('FIRST');
  const [datePickerMonth, setDatePickerMonth] = useState(startOfLocalMonth(new Date()));

  const upsertRecurrence = useCallback((nextRecurrence) => {
    if (!nextRecurrence?.id) return;
    setRecurrences((current) => current.map((item) => (
      String(item.id) === String(nextRecurrence.id) ? { ...item, ...nextRecurrence } : item
    )));
    setDetailsById((current) => ({
      ...current,
      [nextRecurrence.id]: nextRecurrence,
    }));
  }, []);

  const loadRecurrences = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);
    try {
      const response = await apiClient.get('/recorrencias');
      const records = normalizeList(response.data);
      setRecurrences(records);
      setDetailsById((current) => records.reduce((next, record) => {
        next[record.id] = record;
        return next;
      }, { ...current }));
    } catch (error) {
      logApiErrors(error, 'Erro ao carregar recorrências');
      setErrorMessage(getApiMessage(error, 'Não foi possível carregar suas recorrências. Tente novamente.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      protectedAccess.beginAccess();
      return () => {
        protectedAccess.cancelAccess();
        setRecurrences([]);
        setDetailsById({});
        setUpcomingById({});
        setExpandedId(null);
        setEditor(null);
        setLoading(true);
        setErrorMessage(null);
      };
    }, [protectedAccess.beginAccess, protectedAccess.cancelAccess]),
  );

  useEffect(() => {
    if (isFocused && protectedAccess.status === PROTECTED_ACCESS_STATES.UNLOCKED) {
      loadRecurrences();
    }
  }, [isFocused, loadRecurrences, protectedAccess.lifecycleRevision, protectedAccess.status]);

  async function loadDetails(recurrence) {
    const id = String(recurrence.id);
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);
    setDetailLoadingId(id);
    setUpcomingLoadingId(id);
    try {
      const [detailResponse, upcomingResponse] = await Promise.all([
        apiClient.get(`/recorrencias/${recurrence.id}`),
        apiClient.get(`/recorrencias/${recurrence.id}/proximas`, { params: { limit: 5 } }),
      ]);
      setDetailsById((current) => ({ ...current, [id]: detailResponse.data }));
      setUpcomingById((current) => ({
        ...current,
        [id]: Array.isArray(upcomingResponse.data?.ocorrencias) ? upcomingResponse.data.ocorrencias : [],
      }));
    } catch (error) {
      logApiErrors(error, 'Erro ao carregar detalhes da recorrência');
      Alert.alert('Não foi possível carregar', getApiMessage(error, 'Tente novamente em alguns instantes.'));
    } finally {
      setDetailLoadingId(null);
      setUpcomingLoadingId(null);
    }
  }

  async function loadUpcoming(recurrence) {
    const id = String(recurrence.id);
    setUpcomingLoadingId(id);
    try {
      const response = await apiClient.get(`/recorrencias/${recurrence.id}/proximas`, { params: { limit: 5 } });
      setUpcomingById((current) => ({
        ...current,
        [id]: Array.isArray(response.data?.ocorrencias) ? response.data.ocorrencias : [],
      }));
    } catch (error) {
      logApiErrors(error, 'Erro ao carregar próximas ocorrências');
      Alert.alert('Não foi possível carregar', getApiMessage(error, 'Tente novamente em alguns instantes.'));
    } finally {
      setUpcomingLoadingId(null);
    }
  }

  async function runAction(recurrence, action, endpoint, successMessage) {
    const id = String(recurrence.id);
    if (actionId) return;
    setActionId(`${id}:${action}`);
    try {
      const response = await apiClient.post(`/recorrencias/${recurrence.id}/${endpoint}`);
      upsertRecurrence(response.data);
      Alert.alert(successMessage);
    } catch (error) {
      logApiErrors(error, `Erro ao ${action} recorrência`);
      Alert.alert('Não foi possível concluir', getApiMessage(error, 'Tente novamente.'));
    } finally {
      setActionId(null);
    }
  }

  function confirmCancel(recurrence) {
    Alert.alert(
      'Cancelar recorrência?',
      'As compras já geradas serão preservadas, mas nenhuma nova ocorrência será criada.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar recorrência',
          style: 'destructive',
          onPress: () => runAction(recurrence, 'cancelar', 'cancelar', 'Recorrência cancelada.'),
        },
      ],
    );
  }

  async function openEditor(recurrence) {
    if (!['ATIVA', 'PAUSADA'].includes(recurrence.status)) return;
    setEditorLoading(true);
    try {
      const detail = detailsById[recurrence.id]
        || (await apiClient.get(`/recorrencias/${recurrence.id}`)).data;
      const [categoriesResponse, paymentsResponse] = await Promise.all([
        categories.length ? Promise.resolve({ data: categories }) : apiClient.get('/categories'),
        formasPagamento.length ? Promise.resolve({ data: formasPagamento }) : apiClient.get('/formas-pagamento'),
      ]);
      const loadedCategories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
      const loadedPayments = Array.isArray(paymentsResponse.data) ? paymentsResponse.data : [];
      setCategories(loadedCategories);
      setFormasPagamento(loadedPayments);
      setDetailsById((current) => ({ ...current, [recurrence.id]: detail }));
      setEditor(toEditorState(detail));
    } catch (error) {
      logApiErrors(error, 'Erro ao preparar edição da recorrência');
      Alert.alert('Não foi possível editar', getApiMessage(error, 'Tente novamente.'));
    } finally {
      setEditorLoading(false);
    }
  }

  function updateEditor(field, value) {
    setEditor((current) => (current ? { ...current, [field]: value } : current));
  }

  function updateEditorItem(index, field, value) {
    setEditor((current) => {
      if (!current) return current;
      const itens = [...current.itens];
      itens[index] = { ...itens[index], [field]: value };
      return { ...current, itens };
    });
  }

  function addEditorItem() {
    setEditor((current) => (current ? {
      ...current,
      itens: [...current.itens, { categoriaId: null, nome: '', valor: '' }],
    } : current));
  }

  function removeEditorItem(index) {
    setEditor((current) => {
      if (!current || current.itens.length <= 1) return current;
      return { ...current, itens: current.itens.filter((_, itemIndex) => itemIndex !== index) };
    });
  }

  function openEditorDatePicker(target) {
    const value = target === 'END' ? editor?.dataFinal || editor?.primeiraOcorrencia : editor?.primeiraOcorrencia;
    const date = parseDateOnly(value) || new Date();
    setDatePickerTarget(target);
    setDatePickerMonth(startOfLocalMonth(date));
    setDatePickerVisible(true);
  }

  function selectEditorDate(date) {
    const nextDate = formatDateOnly(date);
    if (!editor) return;
    if (datePickerTarget === 'END') {
      const firstDate = parseDateOnly(editor.primeiraOcorrencia);
      if (firstDate && date.getTime() < firstDate.getTime()) return;
      updateEditor('dataFinal', nextDate);
    } else {
      const endDate = parseDateOnly(editor.dataFinal);
      updateEditor('primeiraOcorrencia', nextDate);
      if (endDate && date.getTime() > endDate.getTime()) updateEditor('dataFinal', nextDate);
    }
    setDatePickerVisible(false);
  }

  function changeEditorMonth(amount) {
    setDatePickerMonth((current) => {
      const next = new Date(current);
      next.setMonth(next.getMonth() + amount);
      return startOfLocalMonth(next);
    });
  }

  async function saveEditor() {
    if (!editor || editorSaving) return;
    if (!editor.itens.length) {
      Alert.alert('Itens', 'Adicione pelo menos um item.');
      return;
    }

    const payloadItems = [];
    for (const item of editor.itens) {
      const nome = (item.nome || '').trim();
      const valor = valorMoedaParaNumero(item.valor);
      const categoriaId = Number(item.categoriaId || 0);
      if (!nome) {
        Alert.alert('Campo obrigatório', 'Todos os itens precisam de um nome.');
        return;
      }
      if (!Number.isFinite(valor) || valor <= 0) {
        Alert.alert('Valor inválido', 'Preencha um valor válido para todos os itens.');
        return;
      }
      if (!categoriaId) {
        Alert.alert('Categoria', 'Selecione uma categoria para todos os itens.');
        return;
      }
      payloadItems.push({ categoriaId, nome, valor });
    }

    const formaPagamentoId = Number(editor.formaPagamentoId || 0);
    const firstDate = parseDateOnly(editor.primeiraOcorrencia);
    const endDate = editor.dataFinal ? parseDateOnly(editor.dataFinal) : null;
    if (!formaPagamentoId || !formasPagamento.some((payment) => payment.forma_pagamento_id === formaPagamentoId)) {
      Alert.alert('Forma de pagamento', 'Selecione uma forma de pagamento válida.');
      return;
    }
    if (!firstDate) {
      Alert.alert('Primeira ocorrência', 'Selecione uma data válida.');
      return;
    }
    if (editor.dataFinal && !endDate) {
      Alert.alert('Data final', 'Selecione uma data final válida ou remova o término.');
      return;
    }
    if (endDate && endDate.getTime() < firstDate.getTime()) {
      Alert.alert('Data final', 'A data final não pode ser anterior à primeira ocorrência.');
      return;
    }

    setEditorSaving(true);
    try {
      const response = await apiClient.patch(`/recorrencias/${editor.id}`, {
        formaPagamentoId,
        compraFonte: editor.compraFonte.trim() || null,
        frequencia: editor.frequencia,
        primeiraOcorrencia: formatDateOnly(firstDate),
        dataFinal: endDate ? formatDateOnly(endDate) : null,
        items: payloadItems,
      });
      upsertRecurrence(response.data);
      setEditor(null);
      Alert.alert('Recorrência atualizada', 'As próximas ocorrências usarão a configuração atualizada.');
    } catch (error) {
      logApiErrors(error, 'Erro ao editar recorrência');
      Alert.alert('Não foi possível salvar', getApiMessage(error, 'Confira os dados e tente novamente.'));
    } finally {
      setEditorSaving(false);
    }
  }

  const totalEditor = useMemo(
    () => (editor?.itens || []).reduce((total, item) => total + (valorMoedaParaNumero(item.valor) || 0), 0),
    [editor],
  );

  function renderSecurityState() {
    const isBusy = [PROTECTED_ACCESS_STATES.CHECKING, PROTECTED_ACCESS_STATES.BIOMETRIC].includes(protectedAccess.status);
    const message = protectedAccess.status === PROTECTED_ACCESS_STATES.ERROR
      ? protectedAccess.errorMessage
      : protectedAccess.status === PROTECTED_ACCESS_STATES.BIOMETRIC
        ? 'Confirme sua identidade no aviso do aparelho.'
        : protectedAccess.status === PROTECTED_ACCESS_STATES.LOCKOUT
          ? protectedAccess.errorMessage
          : 'Suas recorrências ficam protegidas por uma confirmação local.';

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.recurrenceIcon}>
            <MaterialCommunityIcons name="shield-lock-outline" size={22} color={COLORS.cadTitulo} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Recorrências</Text>
            <Text style={styles.headerSubtitle}>Confirmação necessária para continuar</Text>
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
          visible={[PROTECTED_ACCESS_STATES.SETUP, PROTECTED_ACCESS_STATES.PIN].includes(protectedAccess.status)}
          mode={protectedAccess.status === PROTECTED_ACCESS_STATES.SETUP ? 'setup' : 'unlock'}
          errorMessage={protectedAccess.errorMessage}
          onSubmit={protectedAccess.status === PROTECTED_ACCESS_STATES.SETUP ? protectedAccess.completeSetup : protectedAccess.submitPin}
          onCancel={protectedAccess.cancelAccess}
        />
      </SafeAreaView>
    );
  }

  function renderUpcoming(recurrence) {
    const id = String(recurrence.id);
    const upcoming = upcomingById[id] || [];
    if (upcomingLoadingId === id) return <ActivityIndicator size="small" color={COLORS.dadoDois} />;
    return (
      <View style={styles.upcomingBox}>
        <View style={styles.upcomingHeader}>
          <MaterialCommunityIcons name="calendar-clock-outline" size={17} color={COLORS.dadoDois} />
          <Text style={styles.upcomingTitle}>Próximas ocorrências</Text>
        </View>
        {upcoming.length ? upcoming.map((occurrence, index) => (
          <View style={styles.upcomingRow} key={`${occurrence.dataPrevista}-${index}`}>
            <View style={styles.upcomingIndex}><Text style={styles.upcomingIndexText}>{index + 1}</Text></View>
            <Text style={styles.upcomingDate}>{formatDate(occurrence.dataPrevista)}</Text>
          </View>
        )) : <Text style={styles.summaryLabel}>Nenhuma ocorrência está programada para este status.</Text>}
      </View>
    );
  }

  function renderCard({ item }) {
    const id = String(item.id);
    const detail = detailsById[id] || item;
    const [pillStyle, pillTextStyle] = statusStyles(item.status);
    const canEdit = ['ATIVA', 'PAUSADA'].includes(item.status);
    const canPause = item.status === 'ATIVA';
    const canResume = item.status === 'PAUSADA';
    const canCancel = ['ATIVA', 'PAUSADA'].includes(item.status);
    const actionRunning = actionId?.startsWith(`${id}:`);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.recurrenceIcon}>
            <MaterialCommunityIcons name="autorenew" size={21} color={COLORS.dadoDois} />
          </View>
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.cardTitle}>{item.compraFonte || 'Compra recorrente'}</Text>
            <Text style={styles.cardSubtitle}>{FREQUENCY_LABELS[item.frequencia] || item.frequencia}</Text>
          </View>
          <View style={[styles.statusPill, pillStyle]}>
            <Text style={[styles.statusPillText, pillTextStyle]}>{STATUS_LABELS[item.status] || item.status}</Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Próxima ocorrência</Text>
            <Text style={styles.summaryValue}>{item.proximaOcorrencia ? formatDate(item.proximaOcorrencia) : 'Sem previsão'}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Data final</Text>
            <Text style={styles.summaryValue}>{item.dataFinal ? formatDate(item.dataFinal) : 'Sem término'}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Primeira ocorrência</Text>
            <Text style={styles.summaryValue}>{formatDate(item.primeiraOcorrencia)}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Forma de pagamento</Text>
            <Text style={styles.summaryValue}>{item.formaPagamento?.nome || 'Não informado'}</Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Valor previsto por ocorrência</Text>
          <Text style={styles.totalValue}>{formatMoney(getTotal(detail))}</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.secondaryAction} onPress={() => loadDetails(item)} activeOpacity={0.82}>
            <Text style={styles.secondaryActionText}>{expandedId === id ? 'Ocultar detalhes' : 'Detalhes'}</Text>
          </TouchableOpacity>
          {canEdit ? (
            <TouchableOpacity style={styles.secondaryAction} onPress={() => openEditor(item)} disabled={editorLoading} activeOpacity={0.82}>
              <Text style={styles.secondaryActionText}>Editar</Text>
            </TouchableOpacity>
          ) : null}
          {canPause ? (
            <TouchableOpacity
              style={[styles.secondaryAction, actionRunning && styles.actionDisabled]}
              onPress={() => runAction(item, 'pausar', 'pausar', 'Recorrência pausada.')}
              disabled={Boolean(actionId)}
              activeOpacity={0.82}>
              <Text style={styles.secondaryActionText}>{actionRunning ? 'Aguarde...' : 'Pausar'}</Text>
            </TouchableOpacity>
          ) : null}
          {canResume ? (
            <TouchableOpacity
              style={[styles.secondaryAction, styles.primaryAction, actionRunning && styles.actionDisabled]}
              onPress={() => runAction(item, 'retomar', 'retomar', 'Recorrência retomada.')}
              disabled={Boolean(actionId)}
              activeOpacity={0.82}>
              <Text style={[styles.secondaryActionText, styles.primaryActionText]}>{actionRunning ? 'Aguarde...' : 'Retomar'}</Text>
            </TouchableOpacity>
          ) : null}
          {canCancel ? (
            <TouchableOpacity
              style={[styles.secondaryAction, styles.dangerAction]}
              onPress={() => confirmCancel(item)}
              disabled={Boolean(actionId)}
              activeOpacity={0.82}>
              <Text style={[styles.secondaryActionText, styles.dangerActionText]}>Cancelar</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {expandedId === id ? (
          <View style={styles.expandedContent}>
            {detailLoadingId === id ? <ActivityIndicator size="small" color={COLORS.dadoDois} /> : (
              <>
                <Text style={styles.expandedTitle}>Itens da recorrência</Text>
                {(detail.itens || []).map((recurrenceItem, index) => (
                  <View style={styles.itemRow} key={`${recurrenceItem.id || recurrenceItem.nome}-${index}`}>
                    <Text style={styles.itemRowName}>{recurrenceItem.nome}</Text>
                    <Text style={styles.itemRowValue}>{formatMoney(recurrenceItem.valor)}</Text>
                  </View>
                ))}
                <TouchableOpacity style={styles.secondaryAction} onPress={() => loadUpcoming(item)} disabled={upcomingLoadingId === id} activeOpacity={0.82}>
                  <Text style={styles.secondaryActionText}>Atualizar próximas datas</Text>
                </TouchableOpacity>
                {renderUpcoming(item)}
              </>
            )}
          </View>
        ) : null}
      </View>
    );
  }

  function renderEditor() {
    if (!editor) return null;
    return (
      <Modal transparent visible animationType="slide" onRequestClose={() => setEditor(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditor(null)}>
          <Pressable style={styles.editorModal} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Editar recorrência</Text>
                <Text style={styles.modalSubtitle}>Ajuste somente a programação futura.</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setEditor(null)}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.dadoUm} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Fonte da compra</Text>
              <CustomTextInput placeholder="Ex.: assinatura" value={editor.compraFonte} onChangeText={(value) => updateEditor('compraFonte', value)} />

              <Text style={styles.fieldLabel}>Forma de pagamento</Text>
              <TouchableOpacity style={styles.editorFieldButton} onPress={() => setPaymentModalVisible(true)} activeOpacity={0.82}>
                <Text style={styles.editorFieldButtonText} numberOfLines={1}>
                  {formasPagamento.find((payment) => payment.forma_pagamento_id === editor.formaPagamentoId)?.forma_pagamento_nome || 'Selecionar forma de pagamento'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.dadoUm} />
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Itens</Text>
              {editor.itens.map((item, index) => (
                <View style={styles.editorItem} key={`editor-item-${index}`}>
                  <View style={styles.editorItemHeader}>
                    <Text style={styles.editorItemTitle}>Item {index + 1}</Text>
                    {editor.itens.length > 1 ? (
                      <TouchableOpacity style={styles.removeEditorItem} onPress={() => removeEditorItem(index)}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.cadTextoAdicionarLimites} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <CustomTextInput placeholder="Nome do item" value={item.nome} onChangeText={(value) => updateEditorItem(index, 'nome', value)} />
                  <View style={styles.editorRow}>
                    <View style={styles.editorValueField}>
                      <CustomTextInput placeholder="R$ 0,00" value={item.valor} onChangeText={(value) => updateEditorItem(index, 'valor', value)} mask="currency" keyboardType="numeric" />
                    </View>
                    <View style={styles.editorCategoryField}>
                      <TouchableOpacity style={styles.editorFieldButton} onPress={() => { setCategoryIndex(index); setCategoryModalVisible(true); }} activeOpacity={0.82}>
                        <Text style={styles.editorFieldButtonText} numberOfLines={1}>
                          {categories.find((category) => category.categoria_id === item.categoriaId)?.categoria_nome || 'Categoria'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.dadoUm} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.addEditorItem} onPress={addEditorItem} activeOpacity={0.82}>
                <MaterialCommunityIcons name="plus" size={18} color={COLORS.dadoDois} />
                <Text style={styles.addEditorItemText}>Adicionar item</Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Frequência</Text>
              <View style={styles.frequencyGrid}>
                {RECURRENCE_FREQUENCIES.map((frequency) => (
                  <TouchableOpacity
                    key={frequency.value}
                    style={[styles.frequencyOption, editor.frequencia === frequency.value && styles.frequencyOptionActive]}
                    onPress={() => updateEditor('frequencia', frequency.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: editor.frequencia === frequency.value }}>
                    <Text style={[styles.frequencyOptionText, editor.frequencia === frequency.value && styles.frequencyOptionTextActive]}>{frequency.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Primeira ocorrência</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => openEditorDatePicker('FIRST')} activeOpacity={0.82}>
                <MaterialCommunityIcons name="calendar-month-outline" size={19} color={COLORS.dadoUm} />
                <Text style={styles.dateButtonText}>{formatDate(editor.primeiraOcorrencia)}</Text>
                <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.dadoUm} />
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Data final opcional</Text>
              {editor.dataFinal ? (
                <View style={styles.endDateRow}>
                  <TouchableOpacity style={[styles.dateButton, { flex: 1 }]} onPress={() => openEditorDatePicker('END')} activeOpacity={0.82}>
                    <MaterialCommunityIcons name="calendar-end-outline" size={19} color={COLORS.dadoUm} />
                    <Text style={styles.dateButtonText}>{formatDate(editor.dataFinal)}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.dadoUm} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeEndDate} onPress={() => updateEditor('dataFinal', null)}>
                    <Text style={styles.removeEndDateText}>Remover</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.editorFieldButton} onPress={() => updateEditor('dataFinal', editor.primeiraOcorrencia)} activeOpacity={0.82}>
                  <Text style={styles.editorFieldButtonText}>Sem término</Text>
                  <MaterialCommunityIcons name="calendar-plus" size={18} color={COLORS.dadoUm} />
                </TouchableOpacity>
              )}

              <View style={[styles.totalRow, { marginTop: 12 }]}>
                <Text style={styles.totalLabel}>Valor previsto por ocorrência</Text>
                <Text style={styles.totalValue}>{formatMoney(totalEditor)}</Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalAction} onPress={() => setEditor(null)} disabled={editorSaving}>
                <Text style={styles.modalActionText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalAction, styles.modalActionPrimary, editorSaving && styles.actionDisabled]} onPress={saveEditor} disabled={editorSaving}>
                <Text style={[styles.modalActionText, styles.modalActionPrimaryText]}>{editorSaving ? 'Salvando...' : 'Salvar alterações'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
        {renderCategoryModal()}
        {renderPaymentModal()}
        {renderDatePickerModal()}
      </Modal>
    );
  }

  function renderCategoryModal() {
    return (
      <Modal transparent visible={categoryModalVisible} animationType="fade" onRequestClose={() => setCategoryModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}>
          <Pressable style={styles.editorModal} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Selecione a categoria</Text>
            <ScrollView style={styles.modalList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={String(category.categoria_id)}
                  style={styles.modalListItem}
                  onPress={() => {
                    updateEditorItem(categoryIndex, 'categoriaId', category.categoria_id);
                    setCategoryModalVisible(false);
                  }}>
                  <Text style={styles.modalListItemText}>{category.categoria_nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  function renderPaymentModal() {
    return (
      <Modal transparent visible={paymentModalVisible} animationType="fade" onRequestClose={() => setPaymentModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPaymentModalVisible(false)}>
          <Pressable style={styles.editorModal} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Forma de pagamento</Text>
            <ScrollView style={styles.modalList}>
              {formasPagamento.map((payment) => (
                <TouchableOpacity
                  key={String(payment.forma_pagamento_id)}
                  style={styles.modalListItem}
                  onPress={() => {
                    updateEditor('formaPagamentoId', payment.forma_pagamento_id);
                    setPaymentModalVisible(false);
                  }}>
                  <Text style={styles.modalListItemText}>{payment.forma_pagamento_nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  function renderDatePickerModal() {
    const firstDate = parseDateOnly(editor?.primeiraOcorrencia);
    const selectedDate = parseDateOnly(datePickerTarget === 'END' ? editor?.dataFinal : editor?.primeiraOcorrencia);
    return (
      <Modal transparent visible={datePickerVisible} animationType="slide" onRequestClose={() => setDatePickerVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setDatePickerVisible(false)}>
          <Pressable style={styles.calendarContainer} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSubtitle}>{datePickerTarget === 'END' ? 'Data final' : 'Primeira ocorrência'}</Text>
                <Text style={styles.modalTitle}>Escolha uma data</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setDatePickerVisible(false)}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.dadoUm} />
              </TouchableOpacity>
            </View>
            <View style={styles.monthNavigation}>
              <TouchableOpacity style={styles.monthButton} onPress={() => changeEditorMonth(-1)}>
                <MaterialCommunityIcons name="chevron-left" size={21} color={COLORS.dadoUm} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(datePickerMonth)}</Text>
              <TouchableOpacity style={styles.monthButton} onPress={() => changeEditorMonth(1)}>
                <MaterialCommunityIcons name="chevron-right" size={21} color={COLORS.dadoUm} />
              </TouchableOpacity>
            </View>
            <View style={styles.weekdayRow}>
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekdayText}>{day}</Text>)}
            </View>
            <View style={styles.calendarGrid}>
              {getCalendarDays(datePickerMonth).map((date, index) => {
                const disabled = datePickerTarget === 'END' && firstDate && date && date.getTime() < firstDate.getTime();
                const selected = date && isSameLocalDate(date, selectedDate);
                return (
                  <View key={date ? date.toISOString() : `empty-${index}`} style={styles.calendarDayCell}>
                    {date ? (
                      <TouchableOpacity
                        style={[styles.calendarDayButton, disabled && styles.calendarDayDisabled, selected && styles.calendarDaySelected]}
                        onPress={() => { if (!disabled) selectEditorDate(date); }}
                        disabled={disabled}
                        accessibilityState={{ disabled, selected }}>
                        <Text style={[styles.calendarDayText, disabled && styles.calendarDayTextDisabled, selected && styles.calendarDayTextSelected]}>{date.getDate()}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}
            </View>
            <Text style={styles.calendarHint}>{datePickerTarget === 'END' ? 'A data final é inclusiva e não pode ser anterior à primeira ocorrência.' : 'A primeira ocorrência será enviada como data civil, sem conversão de fuso.'}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  if (protectedAccess.status !== PROTECTED_ACCESS_STATES.UNLOCKED) return renderSecurityState();

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={21} color={COLORS.dadoUm} />
          </TouchableOpacity>
          <View style={styles.headerCopy}><Text style={styles.headerTitle}>Recorrências</Text><Text style={styles.headerSubtitle}>Organize suas compras programadas</Text></View>
        </View>
        <View style={styles.stateContainer}><ActivityIndicator size="large" color={COLORS.dashboardIconeBotaoCanto} /><Text style={styles.stateText}>Carregando recorrências...</Text></View>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={21} color={COLORS.dadoUm} />
          </TouchableOpacity>
          <View style={styles.headerCopy}><Text style={styles.headerTitle}>Recorrências</Text><Text style={styles.headerSubtitle}>Organize suas compras programadas</Text></View>
        </View>
        <View style={styles.stateContainer}><Text style={styles.stateText}>{errorMessage}</Text><TouchableOpacity style={styles.retryButton} onPress={() => loadRecurrences()}><Text style={styles.retryButtonText}>Tentar novamente</Text></TouchableOpacity></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
          <MaterialCommunityIcons name="arrow-left" size={21} color={COLORS.dadoUm} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Recorrências</Text>
          <Text style={styles.headerSubtitle}>Compras programadas e seus próximos ciclos</Text>
        </View>
        <TouchableOpacity style={styles.headerAction} onPress={() => loadRecurrences(true)} disabled={refreshing} accessibilityLabel="Atualizar recorrências">
          <MaterialCommunityIcons name="refresh" size={20} color={COLORS.dadoUm} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={recurrences}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCard}
        contentContainerStyle={recurrences.length ? styles.listContent : { flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadRecurrences(true)} tintColor={COLORS.dashboardIconeBotaoCanto} />}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><MaterialCommunityIcons name="calendar-sync-outline" size={28} color={COLORS.dadoDois} /></View>
            <Text style={styles.emptyTitle}>Nenhuma recorrência cadastrada</Text>
            <Text style={styles.emptyText}>As programações criadas em Nova compra aparecerão aqui.</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
      {renderEditor()}
    </SafeAreaView>
  );
}
