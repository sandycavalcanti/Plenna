import { presentationStyles } from "./GerenciarCompra.styles";
import { s } from "./GerenciarCompra.styles";
import { purchaseStyles } from './presentationStyles';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';
import CalendarioData from '../CalendarioData';
import CustomButton from '../CustomButton';
import { formatarValorMoedaParaTela, normalizarValorMoedaParaEntrada } from '../CustomTextInput/currency';
import { eventosAtuais, saldoQuantidade, saldoReembolso, valorQuantidadeCentavos } from '../../utils/cicloVidaCompra';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { randomUUID } from 'expo-crypto';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import { criarGravadorEvento, confirmarOperacoesRecuperadas, moedaParaCentavos, dataEfetiva, mensagemGestao } from '../../services/gestaoCompraService';
const options = [['EXCLUSAO_REGISTRO', 'trash-outline', 'Excluir registro', 'Duplicado, incorreto ou criado por engano.'], ['CANCELAMENTO', 'close-circle-outline', 'Registrar cancelamento', 'Sem presumir reembolso.'], ['DEVOLUCAO', 'return-down-back-outline', 'Registrar devolução', 'Compra inteira ou quantidade deste item.'], ['REEMBOLSO', 'cash-outline', 'Registrar reembolso', 'Valor efetivamente devolvido.'], ['CLASSIFICACAO', 'chatbubble-outline', 'Como você considera esta compra?', 'Uma escolha sua, que pode ser revista.']];
const reasons = [['DUPLICADO', 'Registro duplicado'], ['INCORRETO', 'Registro incorreto'], ['NAO_REALIZADA', 'Compra ou item não realizado'], ['OUTRO', 'Outro motivo']];
export default function GerenciarCompra({
  compra,
  item: initialItem,
  onClose,
  onSaved,
  acaoInicial = null,
  eventoInicial = null
}) {
  const [dateOpen, setDateOpen] = useState(false);
  const [item, setItem] = useState(initialItem);
  const [state, setState] = useState({
      loading: true,
      data: null,
      error: null
    }),
    [action, setAction] = useState(acaoInicial),
    [busy, setBusy] = useState(false),
    [valor, setValor] = useState(''),
    [quantidade, setQuantidade] = useState(''),
    [date, setDate] = useState(''),
    [motivo, setMotivo] = useState(null),
    [classificacao, setClassificacao] = useState(null),
    [correction, setCorrection] = useState(null),
    [anulado, setAnulado] = useState(false);
  const initialApplied = useRef(false);
  const scopedItemId = correction ? correction.itemId : item?.compra_item_id;
  const scopedItem = scopedItemId ? (compra.tb_compra_item || []).find(i => i.compra_item_id === scopedItemId) || (item?.compra_item_id === scopedItemId ? item : null) : null;
  const saldo = saldoQuantidade(scopedItem, state.data?.eventos || [], action, correction?.id);
  const quantityDraft = quantidade || (!correction && saldo != null && saldo > 0 ? String(Math.min(1, saldo)) : '');
  const quantityValue = Number(quantityDraft.replace(',', '.'));
  const returnValue = valorQuantidadeCentavos(scopedItem, quantityValue);
  const refundBalance = saldoReembolso(compra, scopedItem, state.data?.eventos || [], correction?.id);
  useEffect(() => {
    if (eventoInicial && state.data && !initialApplied.current) {
      initialApplied.current = true;
      choose(eventoInicial.tipo, eventoInicial);
    }
  }, [eventoInicial, state.data]);
  useEffect(() => {
    if (action !== 'CLASSIFICACAO') return;
    const current = state.data?.resumo?.classificacao;
    if (['IMPULSIVA', 'NAO_IMPULSIVA', 'PREFIRO_NAO_CLASSIFICAR'].includes(current)) setClassificacao(previous => previous ?? current);
  }, [action, state.data]);
  const saver = useRef(null),
    alive = useRef(true),
    sessionRef = useRef(null);
  useEffect(() => {
    saver.current = criarGravadorEvento({
      client: apiClient,
      storage: tokenStorage,
      uuid: randomUUID,
      compraId: compra.compra_id
    });
    let session, clear;
    alive.current = true;
    (async () => {
      try {
        session = await tokenStorage.captureSession();
        if (!session) throw Error('Sessão indisponível');
        sessionRef.current = session;
        clear = () => {
          if (alive.current) {
            setState({
              loading: false,
              data: null,
              error: 'Sua sessão mudou. Feche para continuar.'
            });
            setAction(null);
          }
        };
        session.signal.addEventListener('abort', clear, {
          once: true
        });
        await load(session);
      } catch (e) {
        if (alive.current) setState({
          loading: false,
          data: null,
          error: mensagemGestao(e)
        });
      }
    })();
    return () => {
      alive.current = false;
      session?.signal.removeEventListener('abort', clear);
    };
  }, [compra.compra_id]);
  async function load(session = sessionRef.current) {
    try {
      tokenStorage.assertSession(session.id);
      const {
        data
      } = await apiClient.get(`/v2/compras/${compra.compra_id}/eventos`, {
        signal: session.signal,
        usageMonitoringSessionId: session.id
      });
      tokenStorage.assertSession(session.id);
      if (data?.versaoContrato !== 1 || data.compraId !== compra.compra_id || !Array.isArray(data.eventos)) throw Error('Histórico indisponível');
      if (alive.current) {
        const recovered = confirmarOperacoesRecuperadas(session, compra.compra_id, data.eventos);
        if (recovered) setAction(null);
        setState({
          loading: false,
          data,
          error: null,
          success: recovered ? 'A operação anterior está salva no histórico.' : null
        });
      }
    } catch (e) {
      if (alive.current) setState(old => ({
        ...old,
        loading: false,
        error: mensagemGestao(e)
      }));
    }
  }
  function choose(tipo, event = null) {
    setAction(tipo);
    setCorrection(event);
    setAnulado(false);
    setValor(event?.dados.valorCentavos ? formatarValorMoedaParaTela(String(event.dados.valorCentavos)) : '');
    setQuantidade(event?.dados.quantidade ? String(event.dados.quantidade) : '');
    setDate(event?.dataEfetiva ? event.dataEfetiva.split('-').reverse().join('/') : '');
    setMotivo(event?.dados?.motivo ?? null);
    setDateOpen(false);
    setClassificacao(null);
    setState(s => ({
      ...s,
      error: null
    }));
  }
  async function save() {
    if (busy || !state.data?.disponivel) return;
    try {
      const itemId = scopedItemId;
      const body = {
        versaoContrato: 1,
        revisaoEsperada: state.data.revisao,
        tipo: action,
        dataEfetiva: dataEfetiva(date),
        ...(itemId ? {
          itemId
        } : {}),
        ...(correction ? {
          corrigeEventoId: correction.id,
          anulado
        } : {})
      };
      if (action === 'EXCLUSAO_REGISTRO') {
        if (!motivo) throw Error('Escolha o motivo da exclusão.');
        body.motivo = motivo;
      }
      if (action === 'REEMBOLSO') {
        const cents = moedaParaCentavos(valor);
        if (cents === null) throw Error('Informe o valor reembolsado.');
        if (!anulado && refundBalance != null && cents > refundBalance) throw Error('O valor supera o saldo disponível para reembolso.');
        body.valorCentavos = cents;
      }
      if (['DEVOLUCAO', 'CANCELAMENTO'].includes(action) && scopedItemId && quantityDraft.trim()) {
        const q = Number(quantityDraft.replace(',', '.'));
        if (!Number.isFinite(q) || q <= 0) throw Error('Confira a quantidade.');
        if (!anulado && saldo != null && q > saldo) throw Error('A quantidade supera o saldo disponível.');
        body.quantidade = q;
      }
      if (!anulado && ['DEVOLUCAO', 'CANCELAMENTO'].includes(action) && saldo === 0) throw Error('Não há quantidade disponível para esta operação.');
      if (action === 'CLASSIFICACAO') {
        if (!classificacao) throw Error('Escolha uma opção.');
        body.classificacao = classificacao;
      }
      setBusy(true);
      setState(s => ({
        ...s,
        error: null
      }));
      await saver.current(body);
      if (!alive.current) return;
      if (action === 'EXCLUSAO_REGISTRO') {
        onSaved?.();
        onClose();
        return;
      }
      await load();
      setAction(null);
      setCorrection(null);
      onSaved?.();
    } catch (e) {
      if (alive.current) setState(s => ({
        ...s,
        error: mensagemGestao(e)
      }));
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return <Modal visible transparent animationType="slide" onRequestClose={() => {
    if (!busy) onClose();
  }}>
      <KeyboardAvoidingView behavior="padding" style={s.backdrop}>
        <SafeAreaView style={s.sheet} edges={['bottom']}>
          <View style={s.header}>
            {action && <View style={s.headerIcon}><Ionicons name={options.find(o => o[0] === action)?.[1] || 'create-outline'} size={26} color={action === 'EXCLUSAO_REGISTRO' ? '#D90035' : '#21116A'} /></View>}
            <Text accessibilityRole="header" style={s.title}>
              {action ? correction ? 'Gerenciar evento registrado' : options.find(o => o[0] === action)?.[2] : item ? 'Gerenciar item' : 'Gerenciar compra'}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar gerenciamento" disabled={busy} onPress={onClose} style={s.touch}>
              <Ionicons name="close" size={24} color="#594367" />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={presentationStyles.inline1}>
            {state.error && <Pressable accessibilityRole="button" disabled={busy} onPress={() => load()} style={s.touch}>
                <Text style={s.link}>Atualizar histórico</Text>
              </Pressable>}
            {state.loading && <ActivityIndicator accessibilityLabel="Carregando histórico" />}
            {state.error && <Text accessibilityRole="alert" style={s.error}>
                {state.error}
              </Text>}
            {state.success && <Text accessibilityRole="alert" style={s.note}>
                {state.success}
              </Text>}
            {state.data && !state.data.disponivel && <Text style={s.note}>
                O histórico de operações ainda não está disponível neste
                ambiente.
              </Text>}
            {!action && state.data?.disponivel && <>
                {options.filter(o => (!item || o[0] !== 'CLASSIFICACAO') && (compra.compra_status === 'CONFIRMADA' || o[0] === 'EXCLUSAO_REGISTRO')).sort((a, b) => ['CANCELAMENTO', 'DEVOLUCAO', 'REEMBOLSO', 'EXCLUSAO_REGISTRO', 'CLASSIFICACAO'].indexOf(a[0]) - ['CANCELAMENTO', 'DEVOLUCAO', 'REEMBOLSO', 'EXCLUSAO_REGISTRO', 'CLASSIFICACAO'].indexOf(b[0])).map(([code, icon, title, description]) => <Pressable accessibilityRole="button" key={code} onPress={() => choose(code)} style={s.option}>
                      <View style={purchaseStyles.icon}><Ionicons name={icon} size={21} color={DASHBOARD_THEME.colors.navy} /></View>
                      <View style={{
                flex: 1
              }}>
                        <Text style={s.label}>{['DEVOLUCAO', 'REEMBOLSO'].includes(code) && eventosAtuais(state.data.eventos).some(e => e.tipo === code && (e.itemId ?? null) === (item?.compra_item_id ?? null)) ? code === 'DEVOLUCAO' ? 'Registrar outra devolução' : 'Registrar outro reembolso' : title}</Text>
                        <Text style={s.note}>{description}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={DASHBOARD_THEME.colors.navy} />
                    </Pressable>)}
              </>}
            {action && state.data?.disponivel && <>
                {action !== 'CLASSIFICACAO' && <View style={purchaseStyles.card}>
                  <Text style={s.label}>{scopedItem ? scopedItem.compra_item_nome || 'Item selecionado' : 'Compra inteira'}</Text>
                  <Text style={s.note}>{scopedItem ? 'Esta operação se aplica somente ao item.' : 'Esta operação se aplica à compra inteira.'}</Text>
                  {scopedItem && <Text style={s.note}>Valor unitário: {valorQuantidadeCentavos(scopedItem, 1) == null ? 'Não informado' : formatarValorMoedaParaTela(String(valorQuantidadeCentavos(scopedItem, 1)))}</Text>}
                  {['DEVOLUCAO', 'CANCELAMENTO'].includes(action) && <Text style={s.note}>{action === 'DEVOLUCAO' ? 'A devolução fica no Histórico. Registre o reembolso separadamente.' : 'O cancelamento fica no Histórico. A situação do registro permanece Confirmada.'}</Text>}
                </View>}
                {correction && <View style={purchaseStyles.card}><Text style={purchaseStyles.title}>Corrigir evento registrado</Text>{correction.dados?.valorCentavos != null && <Text style={purchaseStyles.caption}>Valor anterior: {(correction.dados.valorCentavos / 100).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}</Text>}{correction.dados?.quantidade != null && <Text style={purchaseStyles.caption}>Quantidade anterior: {correction.dados.quantidade}</Text>}<Text style={purchaseStyles.caption}>O evento anterior será preservado no histórico.</Text></View>}
                {action === 'EXCLUSAO_REGISTRO' && <>
                    <Text style={s.note}>
                      {scopedItem ? 'O item sai da lista e o total da compra é recalculado. Se for o último item, a compra também será excluída.' : 'A compra e seus itens saem da lista e dos cálculos.'} O histórico permanece armazenado. Isso não registra cancelamento ou reembolso.
                    </Text>
                    <Text style={s.label}>Motivo da exclusão</Text>
                    {reasons.map(([code, label]) => <Pressable accessibilityRole="radio" accessibilityState={{
                checked: motivo === code
              }} key={code} onPress={() => setMotivo(code)} style={[s.option, motivo === code && s.selected]}>
                        <Ionicons name={motivo === code ? 'radio-button-on' : 'radio-button-off'} size={22} color="#594367" />
                        <Text style={s.label}>{label}</Text>
                      </Pressable>)}
                  </>}
                {action === 'CLASSIFICACAO' ? [['IMPULSIVA', 'Impulsiva'], ['NAO_IMPULSIVA', 'Não impulsiva'], ['PREFIRO_NAO_CLASSIFICAR', 'Prefiro não classificar']].map(([code, label]) => <Pressable key={code} accessibilityRole="radio" accessibilityState={{
              checked: classificacao === code
            }} onPress={() => setClassificacao(code)} style={[s.option, classificacao === code && s.selected]}>
                      <View style={purchaseStyles.row}><Ionicons name={classificacao === code ? 'radio-button-on' : 'radio-button-off'} size={22} color={DASHBOARD_THEME.colors.navy} /><Text style={[purchaseStyles.body, purchaseStyles.copy]}>{label}</Text></View>
                    </Pressable>) : <>
                    {action === 'REEMBOLSO' && <>
                      {refundBalance > 0 && <><Text style={s.label}>Tipo de reembolso</Text><View style={{flexDirection: 'row', gap: 8}}>{[['Parcial', false], ['Integral', true]].map(([label, full]) => <Pressable key={label} accessibilityRole="radio" accessibilityState={{checked: (moedaParaCentavos(valor) === refundBalance) === full}} style={[s.option, {flex: 1}, (moedaParaCentavos(valor) === refundBalance) === full && s.selected]} onPress={() => setValor(full ? formatarValorMoedaParaTela(String(refundBalance)) : '')}><Ionicons name={(moedaParaCentavos(valor) === refundBalance) === full ? 'radio-button-on' : 'radio-button-off'} size={20} color="#602B83" /><Text style={s.label}>{label}</Text></Pressable>)}</View></>}
                      <Text style={s.label}>Valor do reembolso</Text>
                      <TextInput accessibilityLabel="Valor reembolsado" placeholder="R$ 0,00" keyboardType="number-pad" value={valor} onChangeText={text => setValor(formatarValorMoedaParaTela(normalizarValorMoedaParaEntrada(text)))} style={s.input} />
                      <Text style={s.note}>{refundBalance == null ? 'O limite será validado com os valores registrados na compra.' : `Disponível para reembolso: ${formatarValorMoedaParaTela(String(refundBalance)) || 'R$ 0,00'}`}</Text>
                      {moedaParaCentavos(valor) != null && refundBalance != null && <Text style={s.note}>{moedaParaCentavos(valor) > refundBalance ? 'O valor supera o saldo disponível.' : moedaParaCentavos(valor) === refundBalance ? 'Este valor completa o reembolso do escopo selecionado.' : 'Reembolso parcial do saldo disponível.'}</Text>}
                      </>}
                    {scopedItemId && ['DEVOLUCAO', 'CANCELAMENTO'].includes(action) && <>
                        <Text style={s.note}>Quantidade comprada: {scopedItem?.compra_item_quantidade ?? 'Não informada'} · Disponível: {saldo ?? 'Não informada'}</Text>
                        <Text style={s.label}>{action === 'DEVOLUCAO' ? 'Quantidade a devolver' : 'Quantidade a cancelar'}</Text>
                        {saldo > 1 && Number.isInteger(saldo) && !correction && <View style={s.header}>
                          <Pressable accessibilityRole="button" accessibilityLabel="Diminuir quantidade" disabled={quantityValue <= 1} style={s.touch} onPress={() => setQuantidade(String(Math.max(1, quantityValue - 1)))}><Ionicons name="remove-circle-outline" size={28} color="#594367" /></Pressable>
                          <Text style={s.label}>{quantityDraft}</Text>
                          <Pressable accessibilityRole="button" accessibilityLabel="Aumentar quantidade" disabled={quantityValue >= saldo} style={s.touch} onPress={() => setQuantidade(String(Math.min(saldo, quantityValue + 1)))}><Ionicons name="add-circle-outline" size={28} color="#594367" /></Pressable>
                        </View>}
                        {saldo > 1 && Number.isInteger(saldo) && !correction ? null : saldo === 1 && !correction ? <Text style={s.label}>1 unidade</Text> : <TextInput accessibilityLabel="Quantidade do evento" placeholder="Quantidade (vazio: item inteiro)" keyboardType="decimal-pad" value={quantityDraft} onChangeText={setQuantidade} style={s.input} />}
                        {action === 'DEVOLUCAO' && <View style={s.amount}><Text style={s.label}>Valor dos itens devolvidos</Text><Text style={s.amountValue}>{returnValue == null ? 'Não disponível' : formatarValorMoedaParaTela(String(returnValue)) || 'R$ 0,00'}</Text></View>}
                        {action === 'DEVOLUCAO' && Number(compra.compra_desconto) > 0 && <Text style={s.note}>Valor antes do desconto da compra, sem rateio por item. Não representa reembolso.</Text>}
                        </>}
                    {action !== 'EXCLUSAO_REGISTRO' && <><Text style={s.label}>{action === 'REEMBOLSO' ? 'Data do reembolso' : action === 'DEVOLUCAO' ? 'Data da devolução' : action === 'CANCELAMENTO' ? 'Data do cancelamento' : 'Data da ocorrência'} (opcional)</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel="Data efetiva do evento" style={s.option} onPress={() => setDateOpen(v => !v)}><Ionicons name="calendar-outline" size={22} color={DASHBOARD_THEME.colors.navy} /><Text style={{flex: 1}}>{date || 'Selecionar data'}</Text><Ionicons name="chevron-forward" size={18} color={DASHBOARD_THEME.colors.navy} /></Pressable>
                    {dateOpen && <CalendarioData value={date ? new Date(dataEfetiva(date) + 'T12:00:00') : undefined} max={new Date()} onChange={value => {
                setDate([value.getDate(), value.getMonth() + 1, value.getFullYear()].map((n, i) => i < 2 ? String(n).padStart(2, '0') : n).join('/'));
                setDateOpen(false);
              }} />}
                    {!!date && <Pressable accessibilityRole="button" style={s.touch} onPress={() => setDate('')}><Text style={s.link}>Remover data</Text></Pressable>}</>}
                  </>}
                {correction && <Pressable accessibilityRole="checkbox" accessibilityState={{
              checked: anulado
            }} onPress={() => setAnulado(v => !v)} style={s.option}>
                    <Text>
                      {anulado ? '✓ ' : ''}Anular este evento informado por
                      engano
                    </Text>
                  </Pressable>}
                <CustomButton disabled={busy} onPress={save} style={[s.primary, {
              width: '100%',
              minHeight: 48,
              justifyContent: 'center'
            }, action === 'EXCLUSAO_REGISTRO' && {
              backgroundColor: '#B32646'
            }]} title={busy ? 'Salvando…' : correction ? anulado ? 'Confirmar anulação' : 'Salvar correção' : {EXCLUSAO_REGISTRO: 'Confirmar exclusão', DEVOLUCAO: 'Confirmar devolução', CANCELAMENTO: 'Confirmar cancelamento', REEMBOLSO: 'Confirmar reembolso', CLASSIFICACAO: 'Salvar classificação'}[action]} />
                <Pressable accessibilityRole="button" disabled={busy} onPress={() => {
              setAction(null);
              setItem(initialItem);
            }} style={s.touch}>
                  <Text style={s.link}>Voltar às opções</Text>
                </Pressable>
              </>}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>;
}
