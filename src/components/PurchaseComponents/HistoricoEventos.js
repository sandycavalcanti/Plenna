import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import { purchaseStyles as s } from './presentationStyles';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';
const names = {
  COMPRA_EDITADA: 'Compra editada',
  ITEM_EDITADO: 'Item editado',
  CANCELAMENTO: 'Cancelamento registrado',
  DEVOLUCAO: 'Devolução registrada',
  REEMBOLSO: 'Reembolso registrado',
  EXCLUSAO_REGISTRO: 'Exclusão do registro',
  CLASSIFICACAO: 'Classificação registrada',
  RESPOSTA_ANALISE: 'Resposta à análise',
  OCULTACAO: 'Privacidade alterada'
};
const icons = {
  CANCELAMENTO: 'close-circle-outline',
  DEVOLUCAO: 'return-down-back-outline',
  REEMBOLSO: 'cash-outline',
  EXCLUSAO_REGISTRO: 'trash-outline',
  CLASSIFICACAO: 'chatbubble-outline',
  RESPOSTA_ANALISE: 'chatbubble-outline',
  OCULTACAO: 'lock-closed-outline'
};
export default function HistoricoEventos({
  compraId,
  compra,
  finalidade = 'COMPRA',
  itemId,
  refreshKey = 0,
  active = true,
  onCorrect,
  itens = []
}) {
  const [scope, setScope] = useState('TODOS'),
    [cursor, setCursor] = useState(null),
    [retry, setRetry] = useState(0),
    [state, setState] = useState({
      rows: [],
      loading: true
    });
  const cache = useRef(null),
    owner = useRef(null);
  const key = `${finalidade}:${compraId}:${itemId || ''}:${scope}:${cursor || ''}:${refreshKey}:${retry}`;
  useEffect(() => {
    setScope('TODOS');
    setCursor(null);
    cache.current = null;
  }, [compraId, itemId]);
  useEffect(() => {
    if (!active) return;
    let alive = true,
      session,
      clear;
    const run = {};
    owner.current = run;
    if (cache.current?.key === key) {
      setState(cache.current);
      return;
    }
    setState({
      rows: [],
      loading: true,
      key
    });
    (async () => {
      try {
        session = await tokenStorage.captureSession();
        if (!alive) return;
        if (!session) throw Error('SESSION');
        clear = () => {
          cache.current = null;
          if (alive) setState({
            rows: [],
            error: true,
            key
          });
        };
        session.signal.addEventListener('abort', clear, {
          once: true
        });
        const params = {
          finalidade,
          ...(cursor ? {
            antes: cursor
          } : {}),
          ...(itemId ? {
            itemId
          } : scope !== 'TODOS' ? {
            escopo: scope
          } : {})
        };
        const {
          data
        } = await apiClient.get(`/v2/compras/${compraId}/eventos/historico`, {
          params,
          signal: session.signal,
          usageMonitoringSessionId: session.id
        });
        tokenStorage.assertSession(session.id);
        if (data?.versaoContrato !== 1 || data.compraId !== compraId || !Array.isArray(data.eventos) || data.eventos.length > 50 || new Set(data.eventos.map(e => e.id)).size !== data.eventos.length || data.eventos.some((e, i, rows) => !Number.isSafeInteger(e.id) || e.id < 1 || !Number.isSafeInteger(e.revisao) || e.revisao < 1 || cursor && e.revisao >= cursor || i && e.revisao >= rows[i - 1].revisao || typeof e.corrigido !== 'boolean' || !Number.isFinite(Date.parse(e.registradaEm)) || itemId && e.itemId !== itemId || scope === 'COMPRA' && e.itemId !== null || scope === 'ITENS' && e.itemId === null) || data.proximaAntes !== null && (data.eventos.length !== 50 || data.proximaAntes !== data.eventos.at(-1)?.revisao)) throw Error('CONTRACT');
        if (alive && owner.current === run) {
          const next = {
            rows: data.eventos.filter(e => finalidade === 'ANALISE' ? ['CLASSIFICACAO', 'RESPOSTA_ANALISE'].includes(e.tipo) : !['CLASSIFICACAO', 'RESPOSTA_ANALISE'].includes(e.tipo)),
            next: data.proximaAntes,
            key
          };
          cache.current = next;
          setState(next);
        }
      } catch {
        if (alive && owner.current === run) setState({
          rows: [],
          error: true,
          key
        });
      }
    })();
    return () => {
      alive = false;
      session?.signal.removeEventListener('abort', clear);
    };
  }, [key, active]);
  // Invalida inclusive a página em cache quando a sessão deixa de existir.
  useEffect(() => {
    if (!active && !cache.current) return;
    let disposed = false,
      session;
    const clear = () => {
      cache.current = null;
      setState(current => ({
        ...current,
        rows: [],
        loading: false,
        error: true
      }));
    };
    Promise.resolve().then(() => tokenStorage.captureSession()).then(s => {
      if (disposed) return;
      session = s;
      if (!s || s.signal.aborted) clear();else s.signal.addEventListener('abort', clear);
    }).catch(clear);
    return () => {
      disposed = true;
      session?.signal.removeEventListener('abort', clear);
    };
  }, [compraId, itemId, active]);
  if (!active) return null;
  const current = state.key === key ? state : {
    rows: [],
    loading: true
  };
  return <View style={s.card}><Text accessibilityRole="header" style={s.title}>{finalidade === 'ANALISE' ? 'Decisões registradas' : itemId ? 'Histórico do item' : 'Histórico da compra'}</Text>
 {!itemId && finalidade !== 'ANALISE' && <View style={s.historyFilters}>{[['TODOS', 'Todos'], ['COMPRA', 'Compra'], ['ITENS', 'Itens']].map(([code, label]) => <Pressable key={code} accessibilityRole="radio" accessibilityState={{
        checked: scope === code
       }} style={[s.historyFilter, scope === code && s.historyFilterSelected]} onPress={() => {
        setScope(code);
        setCursor(null);
      }}><Text style={s.actionText}>{label}</Text></Pressable>)}</View>}
 {current.loading ? <ActivityIndicator accessibilityLabel="Carregando eventos" /> : current.error ? <Pressable accessibilityRole="button" style={s.action} onPress={() => setRetry(v => v + 1)}><Text style={s.actionText}>Não foi possível carregar. Tentar novamente</Text></Pressable> : !current.rows.length ? <Text style={s.caption}>Nenhum evento registrado neste recorte.</Text> : current.rows.map(event => <View key={event.id} style={s.event}>
  <View style={s.row}><Ionicons name={icons[event.tipo] || 'time-outline'} color={DASHBOARD_THEME.colors.navy} size={20} /><Text style={[s.title, s.copy]}>{event.tipo === 'CLASSIFICACAO' && event.dados?.classificacaoAnterior && event.dados.classificacaoAnterior !== 'PENDENTE' ? 'Classifica\u00e7\u00e3o revisada' : names[event.tipo] || 'Evento registrado'}{event.anulado ? ' · anulado' : event.corrigido ? ' · corrigido' : ''}</Text></View>
  <Text style={s.caption}>{event.itemId ? itens.find(i => i.compra_item_id === event.itemId)?.compra_item_nome ?? 'Produto registrado' : 'Compra'}{event.dataEfetiva ? ` · Ocorreu em ${event.dataEfetiva.split('-').reverse().join('/')}` : ''}</Text>
  <Text style={s.caption}>Registrado em {new Date(event.registradaEm).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo'
        })}</Text>
  {event.corrigeEventoId != null && <Text style={s.caption}>Correção de evento anterior</Text>}
  {Number.isSafeInteger(event.dados?.valorCentavos) && <Text style={s.body}>{(event.dados.valorCentavos / 100).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        })}</Text>}
  {Array.isArray(event.dados?.campos) && <Text style={s.caption}>{event.dados.campos.map(c => ({
          nome: 'Nome',
          categoria: 'Categoria',
          valor: 'Valor',
          data: 'Data',
          estabelecimento: 'Estabelecimento',
          pagamento: 'Forma de pagamento',
          anotacao: 'Anota\u00e7\u00e3o'
        })[c]).filter(Boolean).join(' \u00b7 ')}</Text>}
  {event.dados?.quantidade != null && <Text style={s.caption}>Quantidade: {event.dados.quantidade}</Text>}
  {event.dados?.classificacao && <Text style={s.body}>{{
          IMPULSIVA: 'Impulsiva',
          NAO_IMPULSIVA: 'Não impulsiva',
          PREFIRO_NAO_CLASSIFICAR: 'Prefiro não classificar'
        }[event.dados.classificacao] || 'Classificação não identificada'}</Text>}
  {event.tipo === 'RESPOSTA_ANALISE' && <Text style={s.body}>{{
          CONCORDO: 'Você concordou com a sugestão',
          DISCORDO: 'Você discordou da sugestão',
          NAO_SEI: 'Você respondeu: Não sei'
        }[event.dados?.resposta] ?? 'Resposta registrada'}{event.dados?.confirmarImpulsiva ? ' · confirmação como impulsiva' : ''}</Text>}
  {event.dados?.classificacaoAnterior && event.dados?.classificacao && <Text style={s.caption}>Anterior: {{
          PENDENTE: 'Sem classificação',
          IMPULSIVA: 'Impulsiva',
          NAO_IMPULSIVA: 'Não impulsiva'
        }[event.dados.classificacaoAnterior] ?? 'Não identificada'}</Text>}
  {event.tipo === 'CLASSIFICACAO' && <Text style={s.caption}>Sua decisão voluntária</Text>}
  {onCorrect && !event.corrigido && ['CANCELAMENTO', 'DEVOLUCAO', 'REEMBOLSO'].includes(event.tipo) && <Pressable accessibilityRole="button" style={s.action} onPress={() => onCorrect(event)}><Text style={s.actionText}>Corrigir evento</Text></Pressable>}
 </View>)}
 {!current.loading && !current.error && !current.next && finalidade === 'COMPRA' && !itemId && scope !== 'ITENS' && compra?.compra_data_criacao && Number.isFinite(Date.parse(compra.compra_data_criacao)) && <View style={s.event}><Text style={s.title}>Compra criada</Text><Text style={s.caption}>{new Date(compra.compra_data_criacao).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo'
        })}</Text></View>}
 {!!current.next && <Pressable accessibilityRole="button" style={s.action} onPress={() => setCursor(current.next)}><Text style={s.actionText}>Eventos anteriores</Text></Pressable>}
 {cursor !== null && <Pressable accessibilityRole="button" style={s.action} onPress={() => setCursor(null)}><Text style={s.actionText}>Voltar aos recentes</Text></Pressable>}
 </View>;
}
