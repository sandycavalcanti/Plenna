import { styles } from "./styles";
import HistoricoEventos from '../HistoricoEventos';
import { purchaseStyles } from '../presentationStyles';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Alert, Animated, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { randomUUID } from 'expo-crypto';
import { apiClient } from '../../../api/client';
import { tokenStorage } from '../../../api/tokenStorage';
import { criarEditorContexto } from '../../../services/contextoCompraService';
import HistoricoContexto from '../HistoricoContexto';
import HistoricoAvaliacoes from '../HistoricoAvaliacoes';
import ResumoCompra from '../ResumoCompra';
import DescobertasCompra from '../DescobertasCompra';
import PainelAnalise from '../AnaliseCompra/PainelAnalise';
import GerenciarCompra from '../GerenciarCompra';
import { PerguntaContexto, AcoesContexto } from './PerguntaContexto';
import { useEstadoCompra } from '../../../hooks/useEstadoCompra';
import { etapasContexto, rascunhosContexto, resumoDeclarado } from './fluxo';
export default function ContextoCompra({
  compraId,
  compra,
  onClose,
  etapaInicial = 'descobrir',
  revisaoInicial
}) {
  const [state, setState] = useState({
      status: 'loading',
      dados: null
    }),
    [respostas, setRespostas] = useState({}),
    [itens, setItens] = useState({});
  const [etapa, setEtapa] = useState(etapaInicial),
    [indice, setIndice] = useState(0),
    [revisar, setRevisar] = useState(false),
    [retomado, setRetomado] = useState(false);
  const [perspectiva, setPerspectiva] = useState(etapaInicial === 'responder' ? 'Contexto' : etapaInicial === 'compra' ? 'Itens' : 'Análise');
  const [historicoTela, setHistoricoTela] = useState(null);
  const [painelAnalise, setPainelAnalise] = useState(null);
  const [contextRequested, setContextRequested] = useState(etapaInicial !== 'compra');
  const [analysisVisited, setAnalysisVisited] = useState(etapaInicial === 'descobrir');
  useEffect(() => {
    if (['Contexto', 'Análise'].includes(perspectiva)) setContextRequested(true);
    if (perspectiva === 'Análise') setAnalysisVisited(true);
  }, [perspectiva]);
  const [gerenciar, setGerenciar] = useState(null),
    [refreshKey, setRefreshKey] = useState(0);
  const estadoEventos = useEstadoCompra(compraId, refreshKey);
  const gestao = estadoEventos.data;
  const restricaoInsight = estadoEventos.loading ? 'VERIFICANDO_COMPRA' : estadoEventos.error ? 'VERIFICACAO_INDISPONIVEL' : compra?.compra_ativo === 0 ? 'COMPRA_EXCLUIDA' : gestao?.resumo.oculto ? 'COMPRA_OCULTA' : compra?.compra_status && compra.compra_status !== 'CONFIRMADA' ? 'COMPRA_NAO_CONFIRMADA' : gestao?.resumo.cancelamentos > 0 ? 'CANCELAMENTO_REGISTRADO' : undefined;
  const itensPermitidos = useMemo(() => Array.isArray(compra?.tb_compra_item) ? compra.tb_compra_item.filter(item => item.compra_item_ativo !== 0 && !gestao?.resumo.itensOcultos?.includes(item.compra_item_id)).map(item => item.compra_item_id) : undefined, [compra?.tb_compra_item, gestao?.resumo.itensOcultos]);
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
    const reduce = v => {
      if (active) {
        reduced.current = v;
        if (v) {
          animation.current?.stop();
          opacity.current?.setValue(1);
        }
      }
    };
    AccessibilityInfo?.isReduceMotionEnabled?.().then(reduce).catch(() => {});
    const listener = AccessibilityInfo?.addEventListener?.('reduceMotionChanged', reduce);
    return () => {
      active = false;
      listener?.remove();
    };
  }, []);
  useEffect(() => {
    setState({
      status: 'loading',
      dados: null
    });
    setRespostas({});
    setItens({});
    setIndice(0);
    setRevisar(false);
    setEtapa(etapaInicial);
    setHistoricoTela(null);
    setPerspectiva(etapaInicial === 'responder' ? 'Contexto' : etapaInicial === 'compra' ? 'Itens' : 'Análise');
    setRetomado(false);
    setPainelAnalise(null);
    setPrioridades([]);
    setSavedDetails(false);
    setEventOpen(false);
    setEventos([]);
    finish.current = false;
    exitAfterSave.current = false;
    session.current = null;
    setContextRequested(etapaInicial !== 'compra');
    setAnalysisVisited(etapaInicial === 'descobrir');
  }, [compraId]);
  useEffect(() => {
    let active = true,
      instance;
    if (!contextRequested) return;
    setState({
      status: 'loading',
      dados: null
    });
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
          onChange: next => {
            if (!active) return;
            setState({
              ...next,
              compraId
            });
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
                  setPerspectiva('Análise');
                  finish.current = false;
                }
                if (exitAfterSave.current) {
                  exitAfterSave.current = false;
                  onClose();
                }
              } else {
                const draft = rascunhosContexto.ler(captured, compraId, next.dados.contexto.revisao);
                setRespostas(draft?.respostas ?? {});
                setItens(draft?.itens ?? {});
                setIndice(draft?.indice ?? 0);
                setRevisar(draft?.revisar ?? false);
                setRetomado(!!draft);
                if (!draft && !etapasContexto(next.dados).length) {
                  setEtapa('descobrir');
                  if (etapaInicial !== 'compra') setPerspectiva('Análise');
                }
              }
            }
          }
        });
        editor.current = instance;
        instance.load();
      } catch {
        if (active) setState({
          status: 'session',
          dados: null,
          error: 'Entre novamente para continuar.'
        });
      }
    })();
    return () => {
      active = false;
      instance?.dispose();
    };
  }, [compraId, contextRequested]);
  const dados = state.compraId === compraId ? state.dados : null,
    dirty = Object.keys(respostas).length + Object.keys(itens).length > 0,
    saving = state.status === 'saving',
    disabled = !['ready', 'saveError'].includes(state.status);
  const declaracoes = resumoDeclarado(dados?.contexto.respostas ?? {});
  const allSteps = etapasContexto(dados, respostas, itens, revisar, prioridades),
    steps = allSteps,
    position = Math.min(indice, Math.max(steps.length - 1, 0)),
    q = steps[position];
  latest.current = {
    respostas,
    itens,
    indice: position,
    revisar,
    revisao: dados?.contexto.revisao
  };
  useEffect(() => {
    if (dados && session.current && !session.current.signal.aborted) {
      if (dirty) rascunhosContexto.salvar(session.current, compraId, latest.current);else rascunhosContexto.limpar(session.current, compraId);
    }
  }, [respostas, itens, indice, revisar, dados, compraId]);
  useEffect(() => {
    if (!reduced.current && opacity.current && Animated) {
      opacity.current.setValue(0);
      const a = Animated.timing(opacity.current, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true
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
    if (!dirty) {
      setEtapa('descobrir');
      setPerspectiva('Análise');
      if (close) onClose();
      return;
    }
    finish.current = true;
    exitAfterSave.current = close;
    editor.current.save(respostas, Object.entries(itens).map(([itemId, planejamento]) => ({
      itemId: Number(itemId),
      planejamento
    })));
  }
  function close() {
    if (saving) return;
    if (!dirty) {
      onClose();
      return;
    }
    Alert.alert('Continuar depois?', 'Suas escolhas ficam nesta sessão. Você também pode salvá-las agora.', [{
      text: 'Continuar respondendo',
      style: 'cancel'
    }, {
      text: 'Guardar para depois',
      onPress: onClose
    }, {
      text: 'Salvar e sair',
      onPress: () => save(true)
    }]);
  }
  function back() {
    if (painelAnalise) {
      setPainelAnalise(null);
      return;
    }
    if (perspectiva === 'Histórico' && historicoTela) {
      setHistoricoTela(null);
      return;
    }
    if (saving) return;
    if (etapa === 'explorar') {
      setEtapa('descobrir');
      setPerspectiva('Análise');
      return;
    }
    if (etapa === 'descobrir') {
      close();
      return;
    }
    if (position > 0) setIndice(position - 1);else close();
  }
  function next() {
    if (disabled) return;
    if (position < steps.length - 1) setIndice(position + 1);else save();
  }
  function choose(value) {
    if (disabled) return;
    const update = old => {
      const next = {
        ...old
      };
      const key = q.itemId ?? q.campo;
      if (value === undefined) delete next[key];else next[key] = value;
      return next;
    };
    if (q.itemId) setItens(update);else setRespostas(update);
  }
  function review(campo, itemId) {
    setRevisar(true);
    setIndice(typeof campo === 'string' ? Math.max(0, etapasContexto(dados, respostas, itens, true).findIndex(q => itemId ? q.itemId === itemId : !q.itemId && q.campo === campo)) : 0);
    setEtapa('responder');
  }
  const currentValue = q && (q.itemId ? Object.hasOwn(itens, q.itemId) ? itens[q.itemId] : dados?.contexto.itens.find(i => i.itemId === q.itemId)?.planejamento : Object.hasOwn(respostas, q.campo) ? respostas[q.campo] : dados?.contexto.respostas[q.campo]);
  function editRegret() {
    if (disabled) return;
    const anteriores = dados.contexto.eventosPosteriores ?? [];
    const informado = anteriores.includes('ARREPENDIMENTO');
    Alert.alert('Arrependimento', informado ? 'Remover a declaração de arrependimento?' : 'Informar arrependimento após a compra?', [{
      text: 'Cancelar',
      style: 'cancel'
    }, {
      text: informado ? 'Remover declaração de arrependimento' : 'Informar arrependimento',
      onPress: () => editor.current.save({}, [], informado ? anteriores.filter(evento => evento !== 'ARREPENDIMENTO') : [...anteriores, 'ARREPENDIMENTO'])
    }]);
  }
  const respondendo = perspectiva === 'Contexto' && etapa === 'responder' && !!q;
  const scroll = useRef(null);
  useEffect(() => {
    if (respondendo) scroll.current?.scrollTo?.({
      y: 0,
      animated: false
    });
  }, [q?.key, respondendo, state.error]);
  useEffect(() => {
    scroll.current?.scrollTo?.({
      y: 0,
      animated: false
    });
  }, [perspectiva, historicoTela]);
  const AnimatedView = Animated?.View ?? View;
  return <Modal visible animationType="none" onRequestClose={back} presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={{
        flex: 1
      }} accessibilityElementsHidden={!!painelAnalise} importantForAccessibility={painelAnalise ? 'no-hide-descendants' : 'auto'}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" disabled={saving} onPress={back} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={23} color="#594367" />
          </Pressable>
          <Text accessibilityRole="header" style={styles.headerTitle}>
            Sobre sua compra
          </Text>
          {compra?.compra_status !== 'IGNORADA' && <Pressable accessibilityRole="button" accessibilityLabel="Gerenciar compra" style={styles.iconButton} disabled={saving} onPress={() => setGerenciar('MENU')}><Ionicons name="ellipsis-horizontal" size={22} color={DASHBOARD_THEME.colors.navy} /></Pressable>}
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar" disabled={saving} onPress={close} style={styles.iconButton}>
            <Ionicons name="close" size={24} color="#594367" />
          </Pressable>
        </View>
        {compra?.compra_fonte && <Text style={[purchaseStyles.caption, {
          textAlign: 'center',
          marginBottom: 8
        }]}>{compra.compra_fonte}</Text>}
        <View style={styles.tabs} accessibilityRole="tablist">
          {['Contexto', 'Itens', 'Análise', 'Histórico'].map(label => <Pressable key={label} accessibilityRole="tab" accessibilityState={{
            selected: perspectiva === label,
            disabled: saving
          }} disabled={saving} onPress={() => setPerspectiva(label)} style={[styles.tab, perspectiva === label && styles.tabSelected]}>
              <Text style={[styles.tabText, perspectiva === label && styles.tabTextSelected]}>{label}</Text>
            </Pressable>)}
        </View>
        <ScrollView ref={scroll} style={{
          flex: 1
        }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {['Itens', 'Histórico'].includes(perspectiva) && state.status !== 'session' && (estadoEventos.loading ? <ActivityIndicator accessibilityLabel="Carregando eventos da compra" color="#8660A1" /> : estadoEventos.error ? <View style={styles.notice}>
                <Text accessibilityRole="alert" style={styles.note}>Eventos indisponíveis. Não foi possível verificar as movimentações.</Text>
                <Pressable accessibilityRole="button" onPress={() => setRefreshKey(k => k + 1)} style={styles.action}>
                  <Text style={styles.link}>Tentar carregar eventos novamente</Text>
                </Pressable>
              </View> : null)}
          {state.status !== 'session' && perspectiva === 'Itens' && <ResumoCompra onContext={() => {
            setPerspectiva('Contexto');
            review();
          }} compra={compra} refreshKey={refreshKey} onManage={item => setGerenciar(item ? {
            item
          } : 'MENU')} />}
          {state.status !== 'session' && perspectiva === 'Itens' && gestao?.resumo.cancelamentos > 0 && <Text style={styles.caption}>
              Cancelamento registrado · consulte o escopo no histórico
            </Text>}
          {analysisVisited && state.status !== 'session' && <View accessibilityElementsHidden={perspectiva !== 'Análise'} importantForAccessibility={perspectiva === 'Análise' ? 'auto' : 'no-hide-descendants'} style={[styles.panel, {
            display: perspectiva === 'Análise' ? 'flex' : 'none'
          }]}>
              <DescobertasCompra compraId={compraId} compra={gestao?.resumo.itensOcultos?.length ? {
              ...compra,
              compra_valor: null
            } : compra} classificacaoDeclarada={gestao?.resumo.classificacao ?? compra?.compra_classificacao} revisaoEventos={gestao?.revisao} eventos={gestao?.eventos} onDecisaoSalva={() => setRefreshKey(value => value + 1)} onClassificar={() => setGerenciar('CLASSIFICACAO')} gerarInicialAutomaticamente respostaPermitida={!gestao?.resumo.itensOcultos?.length} revisao={dados?.contexto.revisao ?? revisaoInicial} compact restricaoInsight={restricaoInsight} itensPermitidos={itensPermitidos} onRevalidar={() => setRefreshKey(value => value + 1)} onOpenDetails={setPainelAnalise} active={perspectiva === 'Análise'} refreshKey={refreshKey} />
            </View>}
          {state.status === 'loading' && ['Contexto', 'Análise'].includes(perspectiva) && <ActivityIndicator accessibilityLabel="Carregando contexto" color="#8660A1" />}
          {state.error && (perspectiva === 'Contexto' || state.status === 'session') && <View style={styles.notice}>
              <Text accessibilityRole="alert" style={styles.note}>
                {state.error}
              </Text>
              {['error', 'conflict'].includes(state.status) && <Pressable accessibilityRole="button" onPress={() => Alert.alert('Recarregar respostas?', 'As escolhas desta sessão serão substituídas pelas respostas salvas.', [{
              text: 'Cancelar',
              style: 'cancel'
            }, {
              text: 'Recarregar',
              onPress: () => {
                rascunhosContexto.limpar(session.current, compraId);
                setRespostas({});
                setItens({});
                finish.current = false;
                exitAfterSave.current = false;
                editor.current.load();
              }
            }])} style={styles.action}>
                  <Text style={styles.link}>Recarregar contexto</Text>
                </Pressable>}
            </View>}
          {state.perguntasError && perspectiva === 'Contexto' && <Text style={styles.caption}>{state.perguntasError}</Text>}
          {dados && <AnimatedView style={opacity.current ? {
            opacity: opacity.current
          } : undefined}>
              {perspectiva === 'Contexto' && etapa === 'responder' && <View style={styles.panel}>
                  <Text accessibilityRole="header" style={styles.formTitle}>Contexto da compra</Text>
                  {retomado && <Text accessibilityRole="alert" style={styles.note}>
                      Suas escolhas foram retomadas.
                    </Text>}
                  {q ? <>
                      <PerguntaContexto pergunta={q} valor={currentValue} position={position} total={steps.length} disabled={disabled} registrada={q.itemId ? dados.contexto.itens.some(i => i.itemId === q.itemId && i.planejamento != null) : dados.contexto.respostas[q.campo] != null} onChoose={choose} />
                    </> : dados.perguntas ? <>
                      <Text style={styles.note}>
                        Não há perguntas pendentes para esta compra.
                      </Text>
                      <Pressable accessibilityRole="button" onPress={() => setEtapa('descobrir')} style={styles.primary}>
                        <Text style={styles.primaryText}>Ver minha compra</Text>
                      </Pressable>
                    </> : <>
                      <Text style={styles.note}>
                        Suas respostas estão salvas. Atualize as perguntas para
                        continuar.
                      </Text>
                      <Pressable accessibilityRole="button" onPress={() => editor.current.load()} style={styles.action}>
                        <Text style={styles.link}>Atualizar perguntas</Text>
                      </Pressable>
                    </>}
                </View>}
              {perspectiva === 'Contexto' && etapa !== 'responder' && <View style={styles.panel}>
                  <Text accessibilityRole="header" style={styles.question}>
                    Contexto da compra
                  </Text>
                  <Text style={purchaseStyles.caption}>{dados.contexto.revisao > 0 ? 'Contexto registrado' : 'Contexto ainda não informado'}</Text>
                  {declaracoes.length > 0 && <View style={styles.summary}>
                      {declaracoes.map(i => <Pressable key={i.campo} accessibilityRole="button" disabled={disabled} onPress={() => review(i.campo)} style={[styles.summaryRow, {
                  minHeight: 48
                }]}>
                          <Ionicons name={i.icone} size={21} color="#8660A1" />
                          <View style={styles.summaryLabel}>
                            <Text style={styles.note}>{i.titulo}</Text>
                            <Text style={styles.summaryValue}>{i.valor}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={DASHBOARD_THEME.colors.navy} />
                        </Pressable>)}
                    </View>}
                  {!!dados.perguntas?.itens.length && <View style={styles.summary}>
                    <View style={purchaseStyles.sectionHeading}><Ionicons name="bag-handle-outline" size={21} color={DASHBOARD_THEME.colors.navy} /><Text style={purchaseStyles.title}>Itens da compra ({dados.perguntas.itens.length})</Text></View>
                    {dados.perguntas.itens.map(item => {
                  const resposta = dados.contexto.itens.find(i => i.itemId === item.itemId)?.planejamento;
                  const label = {
                    SIM: 'Planejado',
                    NAO: 'Não planejado',
                    PARCIALMENTE: 'Parcialmente planejado',
                    NAO_LEMBRO: 'Não lembro',
                    PREFIRO_NAO_RESPONDER: 'Prefiro não responder'
                  }[resposta] ?? 'Não informado';
                  return <Pressable key={item.itemId} accessibilityRole="button" accessibilityLabel={`Revisar planejamento de ${item.nome}`} disabled={disabled} onPress={() => review('planejamento', item.itemId)} style={styles.itemRow}><Text style={[purchaseStyles.body, purchaseStyles.copy]}>{item.nome}</Text><Text style={purchaseStyles.badge}>{label}</Text><Ionicons name="chevron-forward" size={16} color={DASHBOARD_THEME.colors.navy} /></Pressable>;
                })}
                  </View>}
                  <View style={styles.summary}>
                    <View style={purchaseStyles.sectionHeading}><Ionicons name="chatbubble-outline" size={21} color={DASHBOARD_THEME.colors.navy} /><Text style={purchaseStyles.title}>Classificação voluntária</Text></View>
                    {estadoEventos.loading ? <ActivityIndicator accessibilityLabel="Consultando classificação voluntária" /> : estadoEventos.error ? <Text accessibilityRole="alert" style={purchaseStyles.body}>Não foi possível consultar sua classificação.</Text> : <Text style={purchaseStyles.body}>{{
                    IMPULSIVA: 'Impulsiva',
                    NAO_IMPULSIVA: 'Não impulsiva',
                    PREFIRO_NAO_CLASSIFICAR: 'Prefiro não classificar'
                  }[gestao?.resumo.classificacao] ?? 'Não informada'}</Text>}
                    {compra?.compra_status !== 'AGUARDANDO_CONFIRMACAO' && <Pressable accessibilityRole="button" onPress={() => setGerenciar('CLASSIFICACAO')} style={purchaseStyles.action}><Text style={purchaseStyles.actionText}>Como você considera esta compra?</Text></Pressable>}
                    <View style={styles.regretSection}>
                      <View style={styles.summaryLabel}>
                        <Text style={styles.note}>Arrependimento</Text>
                        <Text accessibilityLiveRegion="polite" style={styles.summaryValue}>{dados.contexto.eventosPosteriores?.includes('ARREPENDIMENTO') ? 'Informado' : 'Não informado'}</Text>
                      </View>
                      <Pressable accessibilityRole="button" accessibilityLabel="Editar arrependimento" accessibilityState={{
                    disabled,
                    busy: saving
                  }} disabled={disabled} onPress={editRegret} style={styles.iconButton}>
                        {saving ? <ActivityIndicator size="small" color={DASHBOARD_THEME.colors.navy} /> : <Ionicons name="create-outline" size={20} color={DASHBOARD_THEME.colors.navy} />}
                      </Pressable>
                    </View>
                  </View>
                  {Object.keys(dados.contexto.respostas).length > 0 || dados.contexto.itens.length > 0 ? <Pressable accessibilityRole="button" disabled={disabled} onPress={() => review()} style={styles.action}>
                      <Text style={styles.link}>Revisar respostas</Text>
                    </Pressable> : allSteps.length > 0 ? <Pressable accessibilityRole="button" disabled={disabled} onPress={() => {
                setRevisar(false);
                setIndice(0);
                setEtapa('responder');
              }} style={styles.primary}>
                      <Text style={styles.primaryText}>
                        Adicionar contexto · opcional
                      </Text>
                    </Pressable> : <Text style={styles.note}>
                      {dados.perguntas ? 'Nenhuma pergunta nova.' : 'Não foi possível consultar as perguntas.'}
                    </Text>}
                </View>}
            </AnimatedView>}
          {perspectiva === 'Análise' && etapa === 'explorar' && state.status !== 'session' && <View style={styles.panel}>
              <Text style={styles.eyebrow}>EXPLORAR</Text>
              <Text style={styles.question}>Comparações desta compra</Text>
              <DescobertasCompra compraId={compraId} revisao={dados?.contexto.revisao} />
              <Pressable accessibilityRole="button" onPress={() => setEtapa('descobrir')} style={styles.primary}>
                <Text style={styles.primaryText}>Voltar ao resumo</Text>
              </Pressable>
              {dados && <Pressable accessibilityRole="button" onPress={() => {
              setPerspectiva('Contexto');
              review();
            }} style={styles.action}>
                  <Text style={styles.link}>Revisar minhas respostas</Text>
                </Pressable>}
            </View>}
          <HistoricoEventos compra={compra} itens={compra?.tb_compra_item} compraId={compraId} refreshKey={refreshKey} active={perspectiva === 'Histórico' && !historicoTela} onCorrect={event => setGerenciar({
            event
          })} />
          {perspectiva === 'Histórico' && state.status !== 'session' && (historicoTela ? <View style={styles.panel}>
            <Pressable accessibilityRole="button" onPress={() => setHistoricoTela(null)} style={purchaseStyles.action}><Text style={purchaseStyles.actionText}>Voltar ao histórico da compra</Text></Pressable>
            {historicoTela === 'classificacoes' ? <HistoricoEventos compraId={compraId} finalidade="ANALISE" refreshKey={refreshKey} /> : <>
              <Text accessibilityRole="header" style={styles.question}>{{
                  respostas: 'Histórico de respostas',
                  avaliacoes: 'Histórico de avaliações',
                  reflexoes: 'Histórico de reflexões'
                }[historicoTela]}</Text>
              {historicoTela === 'respostas' ? <HistoricoContexto itens={compra?.tb_compra_item} compraId={compraId} revisao={dados?.contexto.revisao ?? revisaoInicial} /> : <HistoricoAvaliacoes modo={historicoTela === 'reflexoes' ? 'reflexoes' : 'avaliacoes'} compraId={compraId} revisao={dados?.contexto.revisao ?? revisaoInicial} />}
            </>}
          </View> : <View style={purchaseStyles.card}>
            <Text accessibilityRole="header" style={purchaseStyles.title}>Outros históricos</Text>
            {[['respostas', 'clipboard-outline', 'Histórico de respostas'], ['avaliacoes', 'bar-chart-outline', 'Histórico de avaliações'], ['reflexoes', 'chatbubbles-outline', 'Histórico de reflexões'], ['classificacoes', 'person-outline', 'Histórico de classificações']].map(([key, icon, title]) => <Pressable key={key} accessibilityRole="button" onPress={() => setHistoricoTela(key)} style={purchaseStyles.navigationRow}>
              <Ionicons name={icon} size={20} color={DASHBOARD_THEME.colors.navy} /><Text style={[purchaseStyles.title, purchaseStyles.copy]}>{title}</Text><Ionicons name="chevron-forward" size={18} color={DASHBOARD_THEME.colors.navy} />
            </Pressable>)}
          </View>)}


        </ScrollView>
        {respondendo && <AcoesContexto position={position} total={steps.length} valor={currentValue} disabled={disabled} saving={saving} onBack={back} onNext={next} onFinish={() => save()} />}

        </View>
        {painelAnalise && <PainelAnalise {...painelAnalise} compraId={compraId} revisao={dados?.contexto.revisao ?? revisaoInicial} onClose={() => setPainelAnalise(null)} />}
        {gerenciar && state.status !== 'session' && <GerenciarCompra compra={compra ?? {
        compra_id: compraId,
        compra_status: 'CONFIRMADA'
      }} item={typeof gerenciar === 'object' ? gerenciar.item : undefined} eventoInicial={typeof gerenciar === 'object' ? gerenciar.event : undefined} acaoInicial={typeof gerenciar === 'string' && gerenciar !== 'MENU' ? gerenciar : null} onClose={() => setGerenciar(null)} onSaved={() => {
        setRefreshKey(k => k + 1);
        editor.current?.load();
      }} />}
      </SafeAreaView>
    </Modal>;
}
