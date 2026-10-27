import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './styles';
import { apiClient } from '../../api/client';
import { logApiErrors } from '../../utils/error';
import CustomButton from '../../components/CustomButton';
import CustomTextInput from '../../components/CustomTextInput';
import { valorMoedaParaNumero } from '../../components/CustomTextInput/currency';
import { COLORS } from '../../constants/colors';
import { RECURRENCE_FREQUENCIES } from '../../utils/recurrencePreview';

const classificacoes = ['PENDENTE', 'IMPULSIVA', 'NAO_IMPULSIVA'];

function startOfLocalDay(date) {
  const value = new Date(date);
  value.setHours(12, 0, 0, 0);
  return value;
}

function startOfLocalMonth(date) {
  const value = startOfLocalDay(date);
  value.setDate(1);
  return value;
}

function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(date);
}

function formatMoney(value) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateOnly(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getSaveErrorMessage(error) {
  const message = error?.response?.data?.message || error?.response?.data?.error;
  return typeof message === 'string' && message.trim()
    ? message
    : 'Não foi possível salvar. Confira os dados e tente novamente.';
}

function monthTitle(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .replace(/^./, (letter) => letter.toUpperCase());
}

function getCalendarDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInCurrentMonth }, (_, index) => new Date(year, month, index + 1, 12)),
  ];
}

function isSameLocalDate(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export default function CreateCompraScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [initialLoadError, setInitialLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [items, setItems] = useState([{ nome: '', valor: '', categoriaId: null }]);
  const [fonte, setFonte] = useState('');
  const [classificacao] = useState(classificacoes[0]);
  const [purchaseMode, setPurchaseMode] = useState('UNICA');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('MENSAL');
  const [firstOccurrenceDate, setFirstOccurrenceDate] = useState(startOfLocalDay(new Date()));
  const [endDateEnabled, setEndDateEnabled] = useState(false);
  const [endDate, setEndDate] = useState(null);
  const [datePickerMonth, setDatePickerMonth] = useState(startOfLocalMonth(new Date()));
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryPickerForIndex, setCategoryPickerForIndex] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState('FIRST');
  const [selectedFormaPagamentoId, setSelectedFormaPagamentoId] = useState(null);

  useEffect(() => {
    listarDadosIniciais();
  }, []);

  async function listarDadosIniciais() {
    setLoading(true);
    setInitialLoadError(null);
    try {
      const [respCats, respFormas] = await Promise.all([
        apiClient.get('/categories'),
        apiClient.get('/formas-pagamento'),
      ]);
      const categoriasCarregadas = Array.isArray(respCats.data) ? respCats.data : [];
      const formasCarregadas = Array.isArray(respFormas.data) ? respFormas.data : [];

      setCategories(categoriasCarregadas);
      setFormasPagamento(formasCarregadas);
      setSelectedFormaPagamentoId(
        (current) => current ?? formasCarregadas[0]?.forma_pagamento_id ?? null,
      );
    } catch (error) {
      setInitialLoadError('Não foi possível carregar categorias e formas de pagamento.');
      logApiErrors(error, 'Erro ao carregar dados iniciais para criação de compra');
    } finally {
      setLoading(false);
    }
  }

  function atualizarItem(index, campo, valor) {
    setItems((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  }

  function adicionarItem() {
    setItems((prev) => [...prev, { nome: '', valor: '', categoriaId: null }]);
  }

  function removerItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function abrirSeletorCategoria(index) {
    setCategoryPickerForIndex(index);
    setCategoryModalVisible(true);
  }

  function selecionarCategoriaParaItem(category) {
    if (categoryPickerForIndex === null) return;
    atualizarItem(categoryPickerForIndex, 'categoriaId', category.categoria_id);
    setCategoryModalVisible(false);
    setCategoryPickerForIndex(null);
  }

  function selecionarFormaPagamento(formaPagamento) {
    setSelectedFormaPagamentoId(formaPagamento.forma_pagamento_id);
    setPaymentModalVisible(false);
  }

  function obterNomeFormaPagamentoSelecionada() {
    if (!selectedFormaPagamentoId) return 'Selecionar forma de pagamento';
    return (
      formasPagamento.find(
        (forma) => forma.forma_pagamento_id === selectedFormaPagamentoId,
      )?.forma_pagamento_nome || 'Selecionar forma de pagamento'
    );
  }

  function abrirSeletorData(target = 'FIRST') {
    const selectedDate = target === 'END' && endDate ? endDate : firstOccurrenceDate;
    setDatePickerTarget(target);
    setDatePickerMonth(startOfLocalMonth(selectedDate));
    setDatePickerVisible(true);
  }

  function selecionarData(date) {
    const selectedDate = startOfLocalDay(date);

    if (datePickerTarget === 'END') {
      if (selectedDate.getTime() < firstOccurrenceDate.getTime()) return;
      setEndDate(selectedDate);
    } else {
      setFirstOccurrenceDate(selectedDate);
      if (endDateEnabled && endDate && selectedDate.getTime() > endDate.getTime()) {
        setEndDate(selectedDate);
      }
    }

    setDatePickerVisible(false);
  }

  function alternarDataFinal() {
    if (endDateEnabled) {
      setEndDateEnabled(false);
      setEndDate(null);
      return;
    }

    setEndDateEnabled(true);
    setEndDate(firstOccurrenceDate);
  }

  function removerDataFinal() {
    setEndDateEnabled(false);
    setEndDate(null);
  }

  function alterarMesData(amount) {
    setDatePickerMonth((current) => {
      const next = new Date(current);
      next.setMonth(next.getMonth() + amount);
      return startOfLocalMonth(next);
    });
  }

  async function handleSalvar() {
    if (saving) return;

    setSaving(true);
    try {
      if (!items || items.length === 0) {
        Alert.alert('Erro', 'Adicione ao menos um item à compra.');
        return;
      }

      const payloadItems = [];
      for (const it of items) {
        const nome = (it.nome || '').trim();
        const valor = valorMoedaParaNumero(it.valor);
        const categoriaId = Number(it.categoriaId || 0);

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

      if (purchaseMode === 'RECORRENTE') {
        const formaPagamentoId = Number(selectedFormaPagamentoId || 0);
        if (!formaPagamentoId || !formasPagamento.some((forma) => forma.forma_pagamento_id === formaPagamentoId)) {
          Alert.alert('Forma de pagamento', 'Selecione uma forma de pagamento válida para a recorrência.');
          return;
        }

        await apiClient.post('/recorrencias', {
          formaPagamentoId,
          compraFonte: fonte.trim() || null,
          frequencia: recurrenceFrequency,
          primeiraOcorrencia: formatDateOnly(firstOccurrenceDate),
          dataFinal: endDateEnabled && endDate ? formatDateOnly(endDate) : null,
          items: payloadItems.map((it) => ({
            categoriaId: it.categoriaId,
            nome: it.nome,
            valor: it.valor,
          })),
        });

        Alert.alert(
          'Recorrência cadastrada',
          `A primeira compra será registrada em ${formatDate(firstOccurrenceDate)}. Nenhuma compra foi criada agora.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }

      const payload = {
        formaPagamentoId: selectedFormaPagamentoId ?? formasPagamento[0]?.forma_pagamento_id ?? 1,
        compraHorario: new Date().toISOString(),
        compraFonte: fonte.trim() || null,
        compraClassificacao: classificacao,
        items: payloadItems.map((it) => ({
          categoriaId: it.categoriaId,
          nome: it.nome,
          valor: it.valor,
        })),
      };

      await apiClient.post('/compras', payload);
      navigation.goBack();
    } catch (error) {
      logApiErrors(error, purchaseMode === 'RECORRENTE' ? 'Erro ao salvar recorrência' : 'Erro ao salvar compra');
      Alert.alert('Não foi possível salvar', getSaveErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const totalCompra = items.reduce(
    (total, item) => total + (valorMoedaParaNumero(item.valor) || 0),
    0,
  );
  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.dadoDois} />
        <Text style={styles.loadingText}>Carregando dados da compra...</Text>
      </View>
    );
  }

  if (initialLoadError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <View style={styles.errorIconBox}>
            <MaterialCommunityIcons name="cloud-alert-outline" size={28} color={COLORS.dadoDois} />
          </View>
          <Text style={styles.errorTitle}>Não foi possível carregar</Text>
          <Text style={styles.errorText}>{initialLoadError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={listarDadosIniciais} activeOpacity={0.85}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Voltar">
              <MaterialCommunityIcons name="arrow-left" size={21} color={COLORS.dadoUm} />
            </TouchableOpacity>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Nova compra</Text>
              <Text style={styles.headerSubtitle}>Organize os detalhes em poucos passos.</Text>
            </View>
          </View>

          <View style={styles.modeSelector} accessibilityRole="tablist">
            <TouchableOpacity
              style={[styles.modeOption, purchaseMode === 'UNICA' && styles.modeOptionActive]}
              onPress={() => setPurchaseMode('UNICA')}
              activeOpacity={0.82}
              accessibilityRole="tab"
              accessibilityState={{ selected: purchaseMode === 'UNICA' }}>
              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={19}
                color={purchaseMode === 'UNICA' ? COLORS.dadoUm : COLORS.dadoTres}
              />
              <Text style={[styles.modeOptionText, purchaseMode === 'UNICA' && styles.modeOptionTextActive]}>Compra única</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeOption, purchaseMode === 'RECORRENTE' && styles.modeOptionActive]}
              onPress={() => setPurchaseMode('RECORRENTE')}
              activeOpacity={0.82}
              accessibilityRole="tab"
              accessibilityState={{ selected: purchaseMode === 'RECORRENTE' }}>
              <MaterialCommunityIcons
                name="autorenew"
                size={19}
                color={purchaseMode === 'RECORRENTE' ? COLORS.dadoUm : COLORS.dadoTres}
              />
              <Text style={[styles.modeOptionText, purchaseMode === 'RECORRENTE' && styles.modeOptionTextActive]}>Recorrente</Text>
            </TouchableOpacity>
          </View>

          {purchaseMode === 'RECORRENTE' ? (
            <View style={styles.prototypeBanner}>
              <View style={styles.prototypeIcon}>
                <MaterialCommunityIcons name="calendar-check-outline" size={18} color={COLORS.dadoDois} />
              </View>
              <View style={styles.prototypeCopy}>
                <Text style={styles.prototypeTitle}>Programação recorrente</Text>
                <Text style={styles.prototypeText}>A configuração será salva sem criar uma compra agora. A primeira ocorrência será gerada na data programada.</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Itens da compra</Text>
                <Text style={styles.sectionHint}>Nome, valor e categoria</Text>
              </View>
              <View style={styles.sectionCountBadge}><Text style={styles.sectionCountText}>{items.length}</Text></View>
            </View>

            <View style={styles.itemsList}>
              {items.map((item, index) => {
                const categoryName = item.categoriaId
                  ? categories.find((category) => category.categoria_id === item.categoriaId)?.categoria_nome
                  : null;

                return (
                  <View key={index} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemTitleGroup}>
                        <View style={styles.itemIndexBadge}><Text style={styles.itemIndexText}>{index + 1}</Text></View>
                      </View>
                      {items.length > 1 ? (
                        <TouchableOpacity
                          onPress={() => removerItem(index)}
                          style={styles.removeItemButton}
                          accessibilityRole="button"
                          accessibilityLabel={`Remover item ${index + 1}`}>
                          <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.cadTextoAdicionarLimites} />
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Nome</Text>
                      <CustomTextInput
                        placeholder="Ex.: Mercado"
                        value={item.nome}
                        onChangeText={(value) => atualizarItem(index, 'nome', value)}
                        style={styles.itemInput}
                      />
                    </View>

                    <View style={styles.itemMetaRow}>
                      <View style={styles.valueField}>
                        <Text style={styles.fieldLabel}>Valor</Text>
                        <CustomTextInput
                          placeholder="R$ 0,00"
                          value={item.valor}
                          onChangeText={(value) => atualizarItem(index, 'valor', value)}
                          mask="currency"
                          keyboardType="numeric"
                          style={styles.itemInput}
                        />
                      </View>
                      <View style={styles.categoryField}>
                        <Text style={styles.fieldLabel}>Categoria</Text>
                        <TouchableOpacity style={styles.categoryButton} onPress={() => abrirSeletorCategoria(index)} activeOpacity={0.82}>
                          <Text style={styles.categoryButtonText} numberOfLines={1}>{categoryName || 'Selecionar'}</Text>
                          <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.dadoUm} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity onPress={adicionarItem} style={styles.addItemButton} activeOpacity={0.82}>
              <MaterialCommunityIcons name="plus" size={19} color={COLORS.dadoDois} />
              <Text style={styles.addItemText}>Adicionar item</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.totalCard}>
            <View>
              <Text style={styles.totalLabel}>Total da compra</Text>
              <Text style={styles.totalHint}>{items.length === 1 ? '1 item' : `${items.length} itens`}</Text>
            </View>
            <Text style={styles.totalValue}>{formatMoney(totalCompra)}</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Detalhes do pagamento</Text>
                <Text style={styles.sectionHint}>Como e onde a compra aconteceu</Text>
              </View>
              <MaterialCommunityIcons name="credit-card-outline" size={21} color={COLORS.dadoTres} />
            </View>

            <Text style={styles.fieldLabel}>Forma de pagamento</Text>
            <TouchableOpacity style={styles.categoryButton} onPress={() => setPaymentModalVisible(true)} activeOpacity={0.82}>
              <Text style={styles.categoryButtonText} numberOfLines={1}>{obterNomeFormaPagamentoSelecionada()}</Text>
              <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.dadoUm} />
            </TouchableOpacity>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Fonte da compra <Text style={styles.sectionHint}>(opcional)</Text></Text>
              <CustomTextInput placeholder="Ex.: site, loja ou aplicativo" value={fonte} onChangeText={setFonte} />
            </View>
          </View>

          {purchaseMode === 'RECORRENTE' ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Programação</Text>
                  <Text style={styles.sectionHint}>A primeira ocorrência ainda não foi realizada</Text>
                </View>
                <MaterialCommunityIcons name="calendar-sync-outline" size={22} color={COLORS.dadoDois} />
              </View>

              <Text style={styles.fieldLabel}>Frequência</Text>
              <View style={styles.frequencyGrid}>
                {RECURRENCE_FREQUENCIES.map((frequency) => (
                  <TouchableOpacity
                    key={frequency.value}
                    style={[styles.frequencyOption, recurrenceFrequency === frequency.value && styles.frequencyOptionActive]}
                    onPress={() => setRecurrenceFrequency(frequency.value)}
                    activeOpacity={0.82}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: recurrenceFrequency === frequency.value }}>
                    <Text style={[styles.frequencyOptionText, recurrenceFrequency === frequency.value && styles.frequencyOptionTextActive]}>{frequency.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Primeira data de ocorrência</Text>
              <TouchableOpacity style={styles.dateButton} onPress={abrirSeletorData} activeOpacity={0.82}>
                <MaterialCommunityIcons name="calendar-month-outline" size={20} color={COLORS.dadoUm} />
                <Text style={styles.dateButtonText}>{formatDate(firstOccurrenceDate)}</Text>
                <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.dadoUm} />
              </TouchableOpacity>

              <View style={styles.endDateToggleRow}>
                <View style={styles.endDateToggleCopy}>
                  <Text style={styles.endDateToggleLabel}>Definir data de término</Text>
                  <Text style={styles.endDateToggleHint}>{endDateEnabled ? 'Data final inclusiva' : 'Sem término'}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.endDateToggle, endDateEnabled && styles.endDateToggleActive]}
                  onPress={alternarDataFinal}
                  activeOpacity={0.82}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: endDateEnabled }}
                  accessibilityLabel="Definir data de término">
                  <View style={[styles.endDateToggleThumb, endDateEnabled && styles.endDateToggleThumbActive]} />
                </TouchableOpacity>
              </View>

              {endDateEnabled && endDate ? (
                <View style={styles.endDateFieldRow}>
                  <TouchableOpacity
                    style={[styles.dateButton, styles.endDateButton]}
                    onPress={() => abrirSeletorData('END')}
                    activeOpacity={0.82}>
                    <MaterialCommunityIcons name="calendar-end-outline" size={19} color={COLORS.dadoUm} />
                    <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.dadoUm} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeEndDateButton} onPress={removerDataFinal} activeOpacity={0.82}>
                    <Text style={styles.removeEndDateText}>Remover</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

            </View>
          ) : null}

          <View style={styles.actionsCard}>
            <CustomButton
              title={saving ? 'Salvando...' : purchaseMode === 'RECORRENTE' ? 'Salvar recorrência' : 'Salvar compra'}
              onPress={handleSalvar}
              disabled={saving}
              style={styles.saveButton}
            />
            {purchaseMode === 'RECORRENTE' ? <Text style={styles.disabledSaveHint}>O cadastro salva apenas a programação. A compra será criada pelo backend na data prevista.</Text> : null}
          </View>

          <Modal transparent visible={categoryModalVisible} animationType="fade" onRequestClose={() => setCategoryModalVisible(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}>
              <Pressable style={styles.modalContainer} onPress={(event) => event.stopPropagation()}>
                <Text style={styles.questionTitle}>Selecione a categoria</Text>
                <FlatList
                  data={categories}
                  keyExtractor={(item) => String(item.categoria_id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.categoriaNomeTouchable} onPress={() => selecionarCategoriaParaItem(item)}>
                      <Text style={styles.categoriaNome}>{item.categoria_nome}</Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity onPress={() => setCategoryModalVisible(false)} style={styles.textoFecharModalTouchable}><Text style={styles.textoFecharModal}>Fechar</Text></TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>

          <Modal transparent visible={paymentModalVisible} animationType="fade" onRequestClose={() => setPaymentModalVisible(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setPaymentModalVisible(false)}>
              <Pressable style={styles.modalContainer} onPress={(event) => event.stopPropagation()}>
                <Text style={styles.questionTitle}>Selecione a forma de pagamento</Text>
                <FlatList
                  data={formasPagamento}
                  keyExtractor={(item) => String(item.forma_pagamento_id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.categoriaNomeTouchable} onPress={() => selecionarFormaPagamento(item)}>
                      <Text style={styles.categoriaNome}>{item.forma_pagamento_nome}</Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity onPress={() => setPaymentModalVisible(false)} style={styles.textoFecharModalTouchable}><Text style={styles.textoFecharModal}>Fechar</Text></TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>

          <Modal transparent visible={datePickerVisible} animationType="slide" onRequestClose={() => setDatePickerVisible(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setDatePickerVisible(false)}>
              <Pressable style={styles.datePickerContainer} onPress={(event) => event.stopPropagation()}>
                <View style={styles.datePickerHeader}>
                  <View>
                    <Text style={styles.sectionHint}>{datePickerTarget === 'END' ? 'Data de término' : 'Primeira ocorrência'}</Text>
                    <Text style={styles.sectionTitle}>Escolha uma data</Text>
                  </View>
                  <TouchableOpacity style={styles.closeModalButton} onPress={() => setDatePickerVisible(false)}><MaterialCommunityIcons name="close" size={20} color={COLORS.dadoUm} /></TouchableOpacity>
                </View>
                <View style={styles.monthNavigation}>
                  <TouchableOpacity style={styles.monthNavigationButton} onPress={() => alterarMesData(-1)}><MaterialCommunityIcons name="chevron-left" size={21} color={COLORS.dadoUm} /></TouchableOpacity>
                  <Text style={styles.monthTitle}>{monthTitle(datePickerMonth)}</Text>
                  <TouchableOpacity style={styles.monthNavigationButton} onPress={() => alterarMesData(1)}><MaterialCommunityIcons name="chevron-right" size={21} color={COLORS.dadoUm} /></TouchableOpacity>
                </View>
                <View style={styles.weekdayRow}>
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekdayText}>{day}</Text>)}
                </View>
                <View style={styles.calendarGrid}>
                  {getCalendarDays(datePickerMonth).map((date, index) => {
                    const dateDisabled = datePickerTarget === 'END' && date && date.getTime() < firstOccurrenceDate.getTime();
                    const selectedDate = datePickerTarget === 'END' ? endDate : firstOccurrenceDate;
                    const dateSelected = date && selectedDate && isSameLocalDate(date, selectedDate);

                    return (
                      <View key={date ? date.toISOString() : `empty-${index}`} style={styles.calendarDayCell}>
                        {date ? (
                          <TouchableOpacity
                            style={[
                              styles.calendarDayButton,
                              dateDisabled && styles.calendarDayButtonDisabled,
                              dateSelected && styles.calendarDayButtonSelected,
                            ]}
                            onPress={() => {
                              if (!dateDisabled) selecionarData(date);
                            }}
                            disabled={dateDisabled}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: dateDisabled, selected: dateSelected }}
                            accessibilityLabel={formatDate(date)}>
                            <Text style={[
                              styles.calendarDayText,
                              dateDisabled && styles.calendarDayTextDisabled,
                              dateSelected && styles.calendarDayTextSelected,
                            ]}>{date.getDate()}</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.calendarHint}>
                  {datePickerTarget === 'END' ? 'A data final deve ser igual ou posterior à primeira.' : 'A primeira ocorrência será programada nesta data.'}
                </Text>
              </Pressable>
            </Pressable>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
