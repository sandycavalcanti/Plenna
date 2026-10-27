import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { randomUUID } from 'expo-crypto';
import { apiClient } from '../../../api/client';
import { tokenStorage } from '../../../api/tokenStorage';
import { criarEditorContexto } from '../../../services/contextoCompraService';
import AvaliacaoContextual from '../AvaliacaoContextual';
import HistoricoContexto from '../HistoricoContexto';
import ResumoCompra from '../ResumoCompra';
import DescobertasCompra from '../DescobertasCompra';
import GerenciarCompra from '../GerenciarCompra';
import ComparacaoFinanceira from '../ComparacaoFinanceira';
import ReadingDetails from '../../ReadingDetails';
import { reflexaoContextual } from '../reflexoesVisuais';
import { useEstadoCompra } from '../../../hooks/useEstadoCompra';
import {
  etapasContexto,
  rascunhosContexto,
  resumoDeclarado,
  rotuloOpcao,
} from './fluxo';

export default function ContextoCompra({
  compraId,
  compra,
  onClose,
  etapaInicial = 'descobrir',
}) {
  const [state, setState] = useState({ status: 'loading', dados: null }),
    [respostas, setRespostas] = useState({}),
    [itens, setItens] = useState({});
  const [etapa, setEtapa] = useState(etapaInicial),
    [indice, setIndice] = useState(0),
    [revisar, setRevisar] = useState(false),
    [retomado, setRetomado] = useState(false);
  const [maisContexto, setMaisContexto] = useState(false);
  const [gerenciar, setGerenciar] = useState(null),
    [refreshKey, setRefreshKey] = useState(0);
  const gestao = useEstadoCompra(compraId, refreshKey);
  const [prioridades, setPrioridades] = useState([]),
    [savedDetails, setSavedDetails] = useState(false),
    [eventOpen, setEventOpen] = useState(false),
    [eventos, setEventos] = useState([]);
  const editor = useRef(null),
    session = useRef(null),
    latest = useRef({}),
    finish = useRef(false),
    exitAfterSave = useRef(false);
  const opacity = useRef(Animated ? new Animated.Value(1) : null),
    reduced = useRef(true),
    animation = useRef(null);
  useEffect(() => {
    let active = true;
    const reduce = (v) => {
      if (active) {
        reduced.current = v;
        if (v) {
          animation.current?.stop();
          opacity.current?.setValue(1);
        }
      }
    };
    AccessibilityInfo?.isReduceMotionEnabled?.()
      .then(reduce)
      .catch(() => {});
    const listener = AccessibilityInfo?.addEventListener?.(
      'reduceMotionChanged',
      reduce,
    );
    return () => {
      active = false;
      listener?.remove();
    };
  }, []);
  useEffect(() => {
    let active = true,
      instance;
    setState({ status: 'loading', dados: null });
    setRespostas({});
    setItens({});
    setIndice(0);
    setRevisar(false);
    setEtapa(etapaInicial);
    setRetomado(false);
    setPrioridades([]);
    setSavedDetails(false);
    setEventOpen(false);
    setEventos([]);
    finish.current = false;
    exitAfterSave.current = false;
    session.current = null;
    (async () => {
      try {
        const captured = await tokenStorage.captureSession();
        if (!active) return;
        if (!captured) throw Error('SESSION_REQUIRED');
        tokenStorage.assertSession(captured.id);
        session.current = captured;
        instance = criarEditorContexto({
          compraId,
          client: apiClient,
          storage: tokenStorage,
          uuid: randomUUID,
          onChange: (next) => {
            if (!active) return;
            setState({ ...next, compraId });
            if (next.status === 'session') {
              setRespostas({});
              setItens({});
              setEtapa('responder');
            }
            if (next.status === 'ready') {
              if (next.salvo) {
                rascunhosContexto.limpar(captured, compraId);
                setRespostas({});
                setItens({});
                setRetomado(false);
                setEventOpen(false);
                if (finish.current) {
                  setEtapa('descobrir');
                  finish.current = false;
                }
                if (exitAfterSave.current) {
                  exitAfterSave.current = false;
                  onClose();
                }
              } else {
                const draft = rascunhosContexto.ler(
                  captured,
                  compraId,
                  next.dados.contexto.revisao,
                );
                setRespostas(draft?.respostas ?? {});
                setItens(draft?.itens ?? {});
                setIndice(draft?.indice ?? 0);
                setRevisar(draft?.revisar ?? false);
                setRetomado(!!draft);
                if (!draft && !etapasContexto(next.dados).length)
                  setEtapa('descobrir');
              }
            }
          },
        });
        editor.current = instance;
        instance.load();
      } catch {
        if (active)
          setState({
            status: 'session',
            dados: null,
            error: 'Entre novamente para continuar.',
          });
      }
    })();
    return () => {
      active = false;
      instance?.dispose();
    };
  }, [compraId]);
  const dados = state.compraId === compraId ? state.dados : null,
    dirty = Object.keys(respostas).length + Object.keys(itens).length > 0,
    saving = state.status === 'saving',
    disabled = !['ready', 'saveError'].includes(state.status);
  const declaracoes = resumoDeclarado(dados?.contexto.respostas ?? {}).filter(
    (i) => i.informado,
  );
  const reflexao = reflexaoContextual(dados?.contexto);
  const allSteps = etapasContexto(
      dados,
      respostas,
      itens,
      revisar,
      prioridades,
    ),
    steps = maisContexto || revisar ? allSteps : allSteps.slice(0, 2),
    position = Math.min(indice, Math.max(steps.length - 1, 0)),
    q = steps[position];
  latest.current = {
    respostas,
    itens,
    indice: position,
    revisar,
    revisao: dados?.contexto.revisao,
  };
  useEffect(() => {
    if (dados && session.current && !session.current.signal.aborted && dirty)
      rascunhosContexto.salvar(session.current, compraId, latest.current);
  }, [respostas, itens, indice, revisar, dados, compraId]);
  useEffect(() => {
    if (!reduced.current && opacity.current && Animated) {
      opacity.current.setValue(0);
      const a = Animated.timing(opacity.current, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      });
      animation.current = a;
      a.start();
      return () => {
        a.stop();
        opacity.current?.setValue(1);
      };
    }
  }, [q?.key, etapa]);
  function save(close = false) {
    if (disabled) return;
    finish.current = true;
    exitAfterSave.current = close;
    if (!dirty) {
      setEtapa('descobrir');
      if (close) onClose();
      return;
    }
    editor.current.save(
      respostas,
      Object.entries(itens).map(([itemId, planejamento]) => ({
        itemId: Number(itemId),
        planejamento,
      })),
    );
  }
  function close() {
    if (saving) return;
    if (!dirty) {
      onClose();
      return;
    }
    Alert.alert(
      'Continuar depois?',
      'Suas escolhas ficam nesta sessão. Você também pode salvá-las agora.',
      [
        { text: 'Continuar respondendo', style: 'cancel' },
        { text: 'Guardar para depois', onPress: onClose },
        { text: 'Salvar e sair', onPress: () => save(true) },
      ],
    );
  }
  function back() {
    if (saving) return;
    if (etapa === 'explorar') {
      setEtapa('descobrir');
      return;
    }
    if (etapa === 'descobrir') {
      close();
      return;
    }
    if (position > 0) setIndice(position - 1);
    else close();
  }
  function next() {
    if (position < steps.length - 1) setIndice(position + 1);
    else save();
  }
  function choose(value) {
    if (disabled) return;
    if (q.itemId) setItens((old) => ({ ...old, [q.itemId]: value }));
    else setRespostas((old) => ({ ...old, [q.campo]: value }));
  }
  function review() {
    setRevisar(true);
    setIndice(0);
    setEtapa('responder');
  }
  const currentValue =
    q &&
    (q.itemId
      ? Object.hasOwn(itens, q.itemId)
        ? itens[q.itemId]
        : dados?.contexto.itens.find((i) => i.itemId === q.itemId)?.planejamento
      : Object.hasOwn(respostas, q.campo)
        ? respostas[q.campo]
        : dados?.contexto.respostas[q.campo]);
  const AnimatedView = Animated?.View ?? View;
  return (
    <Modal
      visible
      animationType="none"
      onRequestClose={back}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            disabled={saving}
            onPress={back}
            style={styles.iconButton}
          >
            <Ionicons name="arrow-back" size={23} color="#594367" />
          </Pressable>
          <Text accessibilityRole="header" style={styles.headerTitle}>
            Sobre sua compra
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            disabled={saving}
            onPress={close}
            style={styles.iconButton}
          >
            <Ionicons name="close" size={24} color="#594367" />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {state.status !== 'session' && etapa !== 'responder' && (
            <ResumoCompra compra={compra} />
          )}
          {state.status !== 'session' && etapa === 'descobrir' && gestao && (
            <View style={{ gap: 6 }}>
              {gestao.resumo.cancelamentos > 0 && (
                <Text style={styles.caption}>
                  Cancelamento registrado · consulte o escopo no histórico
                </Text>
              )}
              {gestao.resumo.devolucoes > 0 && (
                <Text style={styles.caption}>
                  Devolução registrada · sem presumir reembolso
                </Text>
              )}
              {gestao.resumo.reembolsadoCentavos > 0 && (
                <Text style={styles.note}>
                  Reembolsos informados:{' '}
                  {(gestao.resumo.reembolsadoCentavos / 100).toLocaleString(
                    'pt-BR',
                    { style: 'currency', currency: 'BRL' },
                  )}
                </Text>
              )}
            </View>
          )}
          {etapa === 'descobrir' && state.status !== 'session' && (
            <View style={styles.panel}>
              <DescobertasCompra
                compraId={compraId}
                revisao={dados?.contexto.revisao}
                compact
                refreshKey={refreshKey}
              />
              <ComparacaoFinanceira compraId={compraId} />
            </View>
          )}
          {state.status === 'loading' && (
            <ActivityIndicator
              accessibilityLabel="Carregando contexto"
              color="#8660A1"
            />
          )}
          {state.error && (
            <View style={styles.notice}>
              <Text accessibilityRole="alert" style={styles.note}>
                {state.error}
              </Text>
              {['error', 'conflict'].includes(state.status) && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    Alert.alert(
                      'Recarregar respostas?',
                      'As escolhas desta sessão serão substituídas pelas respostas salvas.',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Recarregar',
                          onPress: () => {
                            rascunhosContexto.limpar(session.current, compraId);
                            setRespostas({});
                            setItens({});
                            finish.current = false;
                            exitAfterSave.current = false;
                            editor.current.load();
                          },
                        },
                      ],
                    )
                  }
                  style={styles.action}
                >
                  <Text style={styles.link}>Recarregar contexto</Text>
                </Pressable>
              )}
            </View>
          )}
          {state.perguntasError && (
            <Text style={styles.caption}>{state.perguntasError}</Text>
          )}
          {dados && (
            <AnimatedView
              style={opacity.current ? { opacity: opacity.current } : undefined}
            >
              {etapa === 'responder' && (
                <View style={styles.panel}>
                  <Text style={styles.title}>Contexto opcional</Text>
                  {retomado && (
                    <Text accessibilityRole="alert" style={styles.note}>
                      Suas escolhas foram retomadas.
                    </Text>
                  )}
                  {q ? (
                    <>
                      <View style={styles.progressRow}>
                        <Text
                          accessibilityLiveRegion="polite"
                          style={styles.note}
                        >
                          Pergunta {position + 1} de {steps.length}
                        </Text>
                        <Text style={styles.optional}>Opcional</Text>
                      </View>
                      <View
                        accessibilityRole="progressbar"
                        accessibilityValue={{
                          min: 0,
                          max: steps.length,
                          now: position + 1,
                        }}
                        style={styles.track}
                      >
                        <View
                          style={[
                            styles.fill,
                            {
                              width: `${(100 * (position + 1)) / steps.length}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text accessibilityRole="header" style={styles.question}>
                        {q.texto}
                      </Text>
                      <View
                        accessibilityRole="radiogroup"
                        style={styles.options}
                      >
                        {q.opcoes.map((o) => (
                          <Pressable
                            key={o.valor}
                            accessibilityRole="radio"
                            accessibilityState={{
                              checked: currentValue === o.valor,
                              disabled,
                            }}
                            disabled={disabled}
                            onPress={() => choose(o.valor)}
                            style={[
                              styles.option,
                              currentValue === o.valor && styles.selected,
                            ]}
                          >
                            <Text style={styles.optionText}>
                              {rotuloOpcao(o)}
                            </Text>
                            {currentValue === o.valor && (
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color="#704389"
                              />
                            )}
                          </Pressable>
                        ))}
                      </View>
                      {currentValue != null && (
                        <Pressable
                          accessibilityRole="button"
                          disabled={disabled}
                          onPress={() => choose(null)}
                          style={styles.action}
                        >
                          <Text style={styles.link}>Remover resposta</Text>
                        </Pressable>
                      )}
                      <Text style={styles.caption}>
                        Você escolhe o que contar. Sem julgamentos.
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ disabled }}
                        disabled={disabled}
                        onPress={next}
                        style={[styles.primary, disabled && styles.disabled]}
                      >
                        <Text style={styles.primaryText}>
                          {saving
                            ? 'Salvando…'
                            : position === steps.length - 1
                              ? dirty
                                ? 'Salvar e descobrir'
                                : 'Ver minha compra'
                              : 'Continuar →'}
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={disabled}
                        onPress={next}
                        style={styles.action}
                      >
                        <Text style={styles.link}>Pular por enquanto</Text>
                      </Pressable>
                    </>
                  ) : dados.perguntas ? (
                    <>
                      <Text style={styles.note}>
                        Não há perguntas pendentes para esta compra.
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setEtapa('descobrir')}
                        style={styles.primary}
                      >
                        <Text style={styles.primaryText}>Ver minha compra</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Text style={styles.note}>
                        Suas respostas estão salvas. Atualize as perguntas para
                        continuar.
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => editor.current.load()}
                        style={styles.action}
                      >
                        <Text style={styles.link}>Atualizar perguntas</Text>
                      </Pressable>
                    </>
                  )}
                  {!maisContexto &&
                    !revisar &&
                    allSteps.length > steps.length && (
                      <Pressable
                        accessibilityRole="button"
                        disabled={disabled}
                        onPress={() => setMaisContexto(true)}
                        style={styles.action}
                      >
                        <Text style={styles.link}>Adicionar mais contexto</Text>
                      </Pressable>
                    )}
                  <Pressable
                    accessibilityRole="button"
                    disabled={disabled}
                    onPress={() => save()}
                    style={styles.action}
                  >
                    <Text style={styles.link}>Concluir por agora</Text>
                  </Pressable>
                </View>
              )}
              {etapa === 'descobrir' && (
                <View style={styles.panel}>
                  <Text accessibilityRole="header" style={styles.question}>
                    Sua percepção
                  </Text>
                  {declaracoes.length > 0 && (
                    <View style={styles.summary}>
                      {declaracoes.map((i) => (
                        <View key={i.campo} style={styles.summaryRow}>
                          <Ionicons name={i.icone} size={21} color="#8660A1" />
                          <View style={styles.summaryLabel}>
                            <Text style={styles.note}>{i.titulo}</Text>
                            <Text style={styles.summaryValue}>{i.valor}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  {[
                    'IMPULSIVA',
                    'NAO_IMPULSIVA',
                    'PREFIRO_NAO_CLASSIFICAR',
                  ].includes(gestao?.resumo.classificacao) && (
                    <Text style={styles.note}>
                      Classificação voluntária:{' '}
                      {
                        {
                          IMPULSIVA: 'impulsiva',
                          NAO_IMPULSIVA: 'não impulsiva',
                          PREFIRO_NAO_CLASSIFICAR: 'prefiro não classificar',
                        }[gestao.resumo.classificacao]
                      }
                    </Text>
                  )}
                  {reflexao && (
                    <View style={styles.notice}>
                      <Text style={styles.note}>{reflexao.pergunta}</Text>
                      <ReadingDetails label="Baseado em">
                        <Text style={styles.caption}>
                          {reflexao.base.join(' · ')}
                        </Text>
                      </ReadingDetails>
                    </View>
                  )}
                  {Object.keys(dados.contexto.respostas).length > 0 ||
                  dados.contexto.itens.length > 0 ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={disabled}
                      onPress={review}
                      style={styles.action}
                    >
                      <Text style={styles.link}>Revisar percepção</Text>
                    </Pressable>
                  ) : allSteps.length > 0 ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={disabled}
                      onPress={() => {
                        setRevisar(false);
                        setIndice(0);
                        setEtapa('responder');
                      }}
                      style={styles.primary}
                    >
                      <Text style={styles.primaryText}>
                        Adicionar contexto · opcional
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.note}>
                      {dados.perguntas
                        ? 'Nenhuma pergunta nova.'
                        : 'Não foi possível consultar as perguntas.'}
                    </Text>
                  )}
                  {compra?.compra_status !== 'AGUARDANDO_CONFIRMACAO' && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setGerenciar('CLASSIFICACAO')}
                      style={styles.action}
                    >
                      <Text style={styles.link}>
                        Como você considera esta compra?
                      </Text>
                    </Pressable>
                  )}
                  <ReadingDetails label="Arrependimento · opcional">
                    <Text style={styles.caption}>
                      Uma percepção sua, independente de cancelamento ou
                      reembolso.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      disabled={disabled}
                      onPress={() => {
                        if (disabled) return;
                        const anteriores =
                          dados.contexto.eventosPosteriores ?? [];
                        editor.current.save(
                          {},
                          [],
                          anteriores.includes('ARREPENDIMENTO')
                            ? anteriores.filter((e) => e !== 'ARREPENDIMENTO')
                            : [...anteriores, 'ARREPENDIMENTO'],
                        );
                      }}
                      style={styles.action}
                    >
                      <Text style={styles.link}>
                        {dados.contexto.eventosPosteriores?.includes(
                          'ARREPENDIMENTO',
                        )
                          ? 'Remover declaração de arrependimento'
                          : 'Informar arrependimento'}
                      </Text>
                    </Pressable>
                  </ReadingDetails>
                  <Text accessibilityRole="header" style={styles.question}>
                    Histórico e gerenciamento
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setGerenciar('MENU')}
                    style={styles.option}
                  >
                    <Ionicons name="time-outline" size={22} color="#8660A1" />
                    <Text style={styles.link}>
                      Eventos e operações da compra
                    </Text>
                  </Pressable>
                  {dados.contexto.eventosPosteriores?.length > 0 && (
                    <Text style={styles.caption}>
                      Declarações anteriores:{' '}
                      {dados.contexto.eventosPosteriores
                        .map(
                          (e) =>
                            ({
                              CANCELAMENTO: 'cancelamento',
                              DEVOLUCAO: 'devolução',
                              REEMBOLSO: 'reembolso',
                              ARREPENDIMENTO: 'arrependimento declarado',
                            })[e],
                        )
                        .join(', ')}
                      . Sem data ou valor confirmado.
                    </Text>
                  )}
                  <ReadingDetails label="Histórico de respostas">
                    <HistoricoContexto
                      compraId={compraId}
                      revisao={dados.contexto.revisao}
                    />
                  </ReadingDetails>
                  <ReadingDetails label="Reflexão registrada">
                    <AvaliacaoContextual
                      compraId={compraId}
                      revisao={dados.contexto.revisao}
                    />
                  </ReadingDetails>
                </View>
              )}
            </AnimatedView>
          )}
          {etapa === 'explorar' && state.status !== 'session' && (
            <View style={styles.panel}>
              <Text style={styles.eyebrow}>EXPLORAR</Text>
              <Text style={styles.question}>Comparações desta compra</Text>
              <DescobertasCompra
                compraId={compraId}
                revisao={dados?.contexto.revisao}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => setEtapa('descobrir')}
                style={styles.primary}
              >
                <Text style={styles.primaryText}>Voltar ao resumo</Text>
              </Pressable>
              {dados && (
                <Pressable
                  accessibilityRole="button"
                  onPress={review}
                  style={styles.action}
                >
                  <Text style={styles.link}>Revisar minhas respostas</Text>
                </Pressable>
              )}
            </View>
          )}
          {!dados && state.status !== 'session' && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setGerenciar('MENU')}
              style={styles.action}
            >
              <Text style={styles.link}>Eventos e operações da compra</Text>
            </Pressable>
          )}
        </ScrollView>
        {gerenciar && state.status !== 'session' && (
          <GerenciarCompra
            compra={
              compra ?? { compra_id: compraId, compra_status: 'CONFIRMADA' }
            }
            acaoInicial={gerenciar === 'MENU' ? null : gerenciar}
            onClose={() => setGerenciar(null)}
            onSaved={() => {
              setRefreshKey((k) => k + 1);
              editor.current?.load();
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7FC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#594367',
  },
  iconButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE4F2',
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    backgroundColor: '#EEE4F2',
    color: '#655A70',
    fontSize: 12,
  },
  stepActive: { backgroundColor: '#704389', color: '#FFF' },
  stepLabel: { fontSize: 12, color: '#655A70' },
  stepLabelActive: { fontWeight: '700', color: '#594367' },
  content: { padding: 20, paddingBottom: 32 },
  panel: { gap: 16 },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#704389',
  },
  title: { fontSize: 25, lineHeight: 32, fontWeight: '700', color: '#594367' },
  note: { fontSize: 14, lineHeight: 21, color: '#655A70' },
  caption: { fontSize: 12, lineHeight: 18, color: '#655A70' },
  question: {
    fontSize: 21,
    lineHeight: 29,
    fontWeight: '600',
    color: '#594367',
    marginVertical: 6,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optional: { fontSize: 12, color: '#655A70' },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EADCF1',
    overflow: 'hidden',
  },
  fill: { height: 5, backgroundColor: '#8660A1' },
  options: { gap: 9 },
  option: {
    minHeight: 48,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8CBDD',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selected: { backgroundColor: '#EADCF1', borderColor: '#704389' },
  optionText: { flex: 1, fontSize: 15, color: '#594367' },
  primary: {
    minHeight: 52,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#704389',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  disabled: { opacity: 0.5 },
  action: { minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  link: { fontSize: 14, fontWeight: '600', color: '#893467' },
  summary: {
    borderRadius: 20,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EEE4F2',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 13,
  },
  summaryLabel: { flex: 1, gap: 2 },
  summaryValue: { fontSize: 16, fontWeight: '600', color: '#594367' },
  notice: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFF',
    marginBottom: 16,
    gap: 8,
  },
});
