import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { randomUUID } from 'expo-crypto';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import {
  criarGravadorEvento,
  confirmarOperacoesRecuperadas,
  moedaParaCentavos,
  dataEfetiva,
  mensagemGestao,
} from '../../services/gestaoCompraService';
const options = [
  [
    'EXCLUSAO_REGISTRO',
    'trash-outline',
    'Excluir registro',
    'Duplicado, incorreto ou criado por engano.',
  ],
  [
    'CANCELAMENTO',
    'close-circle-outline',
    'Registrar cancelamento',
    'Sem presumir reembolso.',
  ],
  [
    'DEVOLUCAO',
    'return-down-back-outline',
    'Registrar devolução',
    'Compra inteira ou quantidade deste item.',
  ],
  [
    'REEMBOLSO',
    'cash-outline',
    'Registrar reembolso',
    'Valor efetivamente devolvido.',
  ],
  [
    'CLASSIFICACAO',
    'chatbubble-outline',
    'Como você considera esta compra?',
    'Uma escolha sua, que pode ser revista.',
  ],
];
const reasons = [
  ['DUPLICADO', 'Registro duplicado'],
  ['INCORRETO', 'Registro incorreto'],
  ['NAO_REALIZADA', 'Compra ou item não realizado'],
  ['OUTRO', 'Outro motivo'],
];
const historicalEventLabels = {
  OCULTACAO: 'Ocultação registrada',
};
export default function GerenciarCompra({
  compra,
  item: initialItem,
  onClose,
  onSaved,
  acaoInicial = null,
}) {
  const [item, setItem] = useState(initialItem);
  const [state, setState] = useState({
      loading: true,
      data: null,
      error: null,
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
  const saver = useRef(null),
    alive = useRef(true),
    sessionRef = useRef(null);
  useEffect(() => {
    saver.current = criarGravadorEvento({
      client: apiClient,
      storage: tokenStorage,
      uuid: randomUUID,
      compraId: compra.compra_id,
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
              error: 'Sua sessão mudou. Feche para continuar.',
            });
            setAction(null);
          }
        };
        session.signal.addEventListener('abort', clear, { once: true });
        await load(session);
      } catch (e) {
        if (alive.current)
          setState({ loading: false, data: null, error: mensagemGestao(e) });
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
      const { data } = await apiClient.get(
        `/v2/compras/${compra.compra_id}/eventos`,
        { signal: session.signal, rf017SessionId: session.id },
      );
      tokenStorage.assertSession(session.id);
      if (
        data?.versaoContrato !== 1 ||
        data.compraId !== compra.compra_id ||
        !Array.isArray(data.eventos)
      )
        throw Error('Histórico indisponível');
      if (alive.current) {
        const recovered = confirmarOperacoesRecuperadas(
          session,
          compra.compra_id,
          data.eventos,
        );
        if (recovered) setAction(null);
        setState({
          loading: false,
          data,
          error: null,
          success: recovered
            ? 'A operação anterior está salva no histórico.'
            : null,
        });
      }
    } catch (e) {
      if (alive.current)
        setState((old) => ({
          ...old,
          loading: false,
          error: mensagemGestao(e),
        }));
    }
  }
  function choose(tipo, event = null) {
    setAction(tipo);
    setCorrection(event);
    setAnulado(false);
    setValor(
      event?.dados.valorCentavos
        ? (event.dados.valorCentavos / 100).toFixed(2)
        : '',
    );
    setQuantidade(
      event?.dados.quantidade ? String(event.dados.quantidade) : '',
    );
    setDate(
      event?.dataEfetiva
        ? event.dataEfetiva.split('-').reverse().join('/')
        : '',
    );
    setMotivo(null);
    setClassificacao(null);
    setState((s) => ({ ...s, error: null }));
  }
  async function save() {
    if (busy || !state.data?.disponivel) return;
    try {
      const itemId = correction?.itemId ?? item?.compra_item_id;
      const body = {
        versaoContrato: 1,
        revisaoEsperada: state.data.revisao,
        tipo: action,
        dataEfetiva: dataEfetiva(date),
        ...(itemId ? { itemId } : {}),
        ...(correction ? { corrigeEventoId: correction.id, anulado } : {}),
      };
      if (action === 'EXCLUSAO_REGISTRO') {
        if (!motivo) throw Error('Escolha o motivo da exclusão.');
        body.motivo = motivo;
      }
      if (action === 'REEMBOLSO') {
        const cents = moedaParaCentavos(valor);
        if (cents === null) throw Error('Informe o valor reembolsado.');
        body.valorCentavos = cents;
      }
      if (['DEVOLUCAO', 'CANCELAMENTO'].includes(action) && quantidade.trim()) {
        const q = Number(quantidade.replace(',', '.'));
        if (!Number.isFinite(q) || q <= 0) throw Error('Confira a quantidade.');
        body.quantidade = q;
      }
      if (action === 'CLASSIFICACAO') {
        if (!classificacao) throw Error('Escolha uma opção.');
        body.classificacao = classificacao;
      }
      setBusy(true);
      setState((s) => ({ ...s, error: null }));
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
      if (alive.current) setState((s) => ({ ...s, error: mensagemGestao(e) }));
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  const corrected = new Set(
    state.data?.eventos
      .filter((e) => e.corrigeEventoId)
      .map((e) => e.corrigeEventoId),
  );
  const events = (state.data?.eventos || []).filter(
    (e) => !item || e.itemId === item.compra_item_id,
  );
  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <View style={s.backdrop}>
        <SafeAreaView style={s.sheet} edges={['bottom']}>
          <View style={s.header}>
            <Text accessibilityRole="header" style={s.title}>
              {action
                ? options.find((o) => o[0] === action)?.[2]
                : item
                  ? 'O que aconteceu com este item?'
                  : 'O que aconteceu com esta compra?'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar gerenciamento"
              disabled={busy}
              onPress={onClose}
              style={s.touch}
            >
              <Ionicons name="close" size={24} color="#594367" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            {state.error && (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => load()}
                style={s.touch}
              >
                <Text style={s.link}>Atualizar histórico</Text>
              </Pressable>
            )}
            {state.loading && (
              <ActivityIndicator accessibilityLabel="Carregando histórico" />
            )}
            {state.error && (
              <Text accessibilityRole="alert" style={s.error}>
                {state.error}
              </Text>
            )}
            {state.success && (
              <Text accessibilityRole="alert" style={s.note}>
                {state.success}
              </Text>
            )}
            {state.data && !state.data.disponivel && (
              <Text style={s.note}>
                O histórico de operações ainda não está disponível neste
                ambiente.
              </Text>
            )}
            {!action && state.data?.disponivel && (
              <>
                {options
                  .filter(
                    (o) =>
                      (!item || o[0] !== 'CLASSIFICACAO') &&
                      (compra.compra_status === 'CONFIRMADA' ||
                        o[0] === 'EXCLUSAO_REGISTRO'),
                  )
                  .map(([code, icon, title, description]) => (
                    <Pressable
                      accessibilityRole="button"
                      key={code}
                      onPress={() => choose(code)}
                      style={s.option}
                    >
                      <Ionicons name={icon} size={23} color="#8660A1" />
                      <View style={{ flex: 1 }}>
                        <Text style={s.label}>{title}</Text>
                        <Text style={s.note}>{description}</Text>
                      </View>
                    </Pressable>
                  ))}
                <Text style={s.label}>Histórico</Text>
                {events.length === 0 ? (
                  <Text style={s.note}>Nenhuma operação registrada.</Text>
                ) : (
                  events.map((e) => (
                    <View key={e.id} style={s.history}>
                      <Text style={s.label}>
                        {options.find((o) => o[0] === e.tipo)?.[2] || historicalEventLabels[e.tipo] || e.tipo}
                        {e.anulado
                          ? ' · anulado'
                          : corrected.has(e.id)
                            ? ' · corrigido'
                            : ''}
                      </Text>
                      <Text style={s.note}>
                        {e.dataEfetiva
                          ? 'Ocorreu em ' +
                            e.dataEfetiva.split('-').reverse().join('/')
                          : 'Data do evento não informada'}
                      </Text>
                      <Text style={s.note}>
                        Registrado em{' '}
                        {new Date(e.registradaEm).toLocaleDateString('pt-BR')}
                      </Text>
                      {e.dados.classificacao && (
                        <Text style={s.note}>
                          Classificação:{' '}
                          {
                            {
                              IMPULSIVA: 'impulsiva',
                              NAO_IMPULSIVA: 'não impulsiva',
                              PREFIRO_NAO_CLASSIFICAR:
                                'prefiro não classificar',
                            }[e.dados.classificacao]
                          }
                        </Text>
                      )}
                      {e.dados.quantidade != null && (
                        <Text style={s.note}>
                          Quantidade: {e.dados.quantidade}
                        </Text>
                      )}
                      {e.dados.valorCentavos != null && (
                        <Text style={s.label}>
                          {(e.dados.valorCentavos / 100).toLocaleString(
                            'pt-BR',
                            { style: 'currency', currency: 'BRL' },
                          )}
                        </Text>
                      )}
                      {e.dados.motivo && (
                        <Text style={s.note}>
                          {reasons.find((r) => r[0] === e.dados.motivo)?.[1] ||
                            'Motivo não informado'}
                        </Text>
                      )}
                      {!corrected.has(e.id) &&
                        ['CANCELAMENTO', 'DEVOLUCAO', 'REEMBOLSO'].includes(
                          e.tipo,
                        ) && (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => choose(e.tipo, e)}
                            style={s.touch}
                          >
                            <Text style={s.link}>Corrigir evento</Text>
                          </Pressable>
                        )}
                    </View>
                  ))
                )}
              </>
            )}
            {action && state.data?.disponivel && (
              <>
                {action === 'EXCLUSAO_REGISTRO' && (
                  <>
                    <Text style={s.note}>
                      O registro sai dos cálculos. Isso não registra
                      cancelamento ou reembolso.
                    </Text>
                    {reasons.map(([code, label]) => (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ checked: motivo === code }}
                        key={code}
                        onPress={() => setMotivo(code)}
                        style={[s.option, motivo === code && s.selected]}
                      >
                        <Text>{label}</Text>
                      </Pressable>
                    ))}
                  </>
                )}
                {action === 'CLASSIFICACAO' ? (
                  [
                    ['IMPULSIVA', 'Impulsiva'],
                    ['NAO_IMPULSIVA', 'Não impulsiva'],
                    ['PREFIRO_NAO_CLASSIFICAR', 'Prefiro não classificar'],
                  ].map(([code, label]) => (
                    <Pressable
                      key={code}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: classificacao === code }}
                      onPress={() => setClassificacao(code)}
                      style={[s.option, classificacao === code && s.selected]}
                    >
                      <Text>{label}</Text>
                    </Pressable>
                  ))
                ) : (
                  <>
                    {action === 'REEMBOLSO' && (
                      <TextInput
                        accessibilityLabel="Valor reembolsado"
                        placeholder="Valor reembolsado (R$)"
                        keyboardType="decimal-pad"
                        value={valor}
                        onChangeText={setValor}
                        style={s.input}
                      />
                    )}
                    {(item || correction?.itemId) &&
                      ['DEVOLUCAO', 'CANCELAMENTO'].includes(action) && (
                        <TextInput
                          accessibilityLabel="Quantidade do evento"
                          placeholder="Quantidade (vazio: item inteiro)"
                          keyboardType="decimal-pad"
                          value={quantidade}
                          onChangeText={setQuantidade}
                          style={s.input}
                        />
                      )}
                    <TextInput
                      accessibilityLabel="Data efetiva do evento"
                      placeholder="Quando ocorreu? DD/MM/AAAA (opcional)"
                      value={date}
                      onChangeText={setDate}
                      style={s.input}
                    />
                    <Text style={s.note}>
                      Sem data informada, não será presumida uma data histórica.
                    </Text>
                  </>
                )}
                {correction && (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: anulado }}
                    onPress={() => setAnulado((v) => !v)}
                    style={s.option}
                  >
                    <Text>
                      {anulado ? '✓ ' : ''}Anular este evento informado por
                      engano
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={save}
                  style={[
                    s.primary,
                    action === 'EXCLUSAO_REGISTRO' && {
                      backgroundColor: '#B32646',
                    },
                  ]}
                >
                  <Text style={s.primaryText}>
                    {busy
                      ? 'Registrando…'
                      : action === 'EXCLUSAO_REGISTRO'
                        ? 'Confirmar exclusão do registro'
                        : 'Confirmar registro'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => {
                    setAction(null);
                    setItem(initialItem);
                  }}
                  style={s.touch}
                >
                  <Text style={s.link}>Voltar às opções</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0005' },
  sheet: {
    maxHeight: '90%',
    backgroundColor: '#FAF7FC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontSize: 19, fontWeight: '700', color: '#594367' },
  touch: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 10 },
  option: {
    minHeight: 54,
    padding: 13,
    borderRadius: 16,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E4D8EB',
  },
  selected: { backgroundColor: '#EEE4F2', borderColor: '#8660A1' },
  label: { fontSize: 15, fontWeight: '600', color: '#594367' },
  note: { fontSize: 12, lineHeight: 18, color: '#655A70' },
  input: {
    minHeight: 50,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8CBDD',
    backgroundColor: '#FFF',
  },
  primary: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#704389',
  },
  primaryText: { color: '#FFF', fontWeight: '600' },
  error: { color: '#B32646', fontSize: 14 },
  link: { color: '#893467', fontWeight: '600' },
  history: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D8CBDD',
    gap: 5,
  },
});
