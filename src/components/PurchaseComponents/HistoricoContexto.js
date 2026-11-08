import { presentationStyles } from "./HistoricoContexto.styles";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import { validarContexto } from '../../services/contextoCompraService';
import RegistroHistorico, { LinhaHistorica } from './RegistrosContextuais/RegistroHistorico';
import { styles } from './RegistrosContextuais/RegistroHistorico.styles';
import { apresentarContextoHistorico } from './RegistrosContextuais/apresentacao';
export default function HistoricoContexto({
  compraId,
  revisao
}) {
  const [state, setState] = useState({
    rows: [],
    loading: true,
    error: false,
    next: null
  });
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState(null);
  const owner = useRef(null),
    busy = useRef(false);
  useEffect(() => {
    let alive = true,
      session,
      clear;
    busy.current = false;
    owner.current = {
      id: compraId,
      revisao,
      alive: () => alive
    };
    setSelected(null);
    setState({
      rows: [],
      loading: true,
      error: false,
      next: null,
      compraId,
      revisao
    });
    (async () => {
      try {
        session = await tokenStorage.captureSession();
        if (!session) throw Error('SESSION');
        clear = () => {
          alive = false;
          setState({
            rows: [],
            loading: false,
            error: true,
            next: null,
            compraId,
            revisao
          });
        };
        session.signal.addEventListener('abort', clear, {
          once: true
        });
        if (alive) {
          owner.current.session = session;
          await load(null, true);
        }
      } catch {
        if (alive) setState({
          rows: [],
          loading: false,
          error: true,
          next: null,
          compraId,
          revisao
        });
      }
    })();
    return () => {
      alive = false;
      session?.signal.removeEventListener('abort', clear);
    };
  }, [compraId, revisao, retry]);
  async function load(antes, replace = false) {
    const scope = owner.current;
    if (busy.current || !scope?.session) return;
    busy.current = true;
    setSelected(null);
    setState(s => ({
      ...s,
      loading: true,
      error: false
    }));
    try {
      const session = scope.session;
      tokenStorage.assertSession(session.id);
      const {
        data
      } = await apiClient.get(`/v2/compras/${scope.id}/contexto/historico`, {
        params: antes ? {
          antes
        } : {},
        signal: session.signal,
        usageMonitoringSessionId: session.id
      });
      tokenStorage.assertSession(session.id);
      if (data?.versaoContrato !== 1 || data.compraId !== scope.id || !Array.isArray(data.revisoes) || data.revisoes.length > 50 || !(data.proximaAntes === null || Number.isInteger(data.proximaAntes) && data.proximaAntes > 0)) throw Error('HISTORY');
      const rows = data.revisoes.map(row => validarContexto(row, scope.id));
      if (rows.some((r, i) => r.revisao < 1 || antes && r.revisao >= antes || i > 0 && r.revisao >= rows[i - 1].revisao) || data.proximaAntes !== null && data.proximaAntes !== rows.at(-1)?.revisao) throw Error('HISTORY');
      if (scope === owner.current && scope.alive()) setState(s => ({
        rows,
        compraId: scope.id,
        revisao: scope.revisao,
        latest: antes ? s.latest : Math.max(scope.revisao ?? 0, rows[0]?.revisao ?? 0),
        before: antes ?? null,
        loading: false,
        error: false,
        next: data.proximaAntes
      }));
    } catch {
      if (scope === owner.current && scope.alive()) setState(s => ({
        ...s,
        loading: false,
        error: true
      }));
    } finally {
      if (scope === owner.current) busy.current = false;
    }
  }
  const current = state.compraId === compraId && state.revisao === revisao ? state : {
    rows: [],
    loading: true,
    error: false,
    next: null
  };
  const prepared = useMemo(() => current.rows.map((row, index) => ({
    row,
    view: apresentarContextoHistorico(row, current.rows[index + 1])
  })), [current.rows]);
  return <View style={styles.list}>
      {current.loading && <ActivityIndicator accessibilityLabel="Carregando revisões" />}
      {current.error && <>
          <Text accessibilityRole="alert">
            Não foi possível consultar as revisões.
          </Text>
          <Pressable accessibilityRole="button" onPress={() => owner.current?.session ? load(current.next, !current.rows.length) : setRetry(n => n + 1)} style={presentationStyles.inline1}>
            <Text>Tentar novamente</Text>
          </Pressable>
        </>}
      {!current.loading && !current.error && !current.rows.length && <Text>Nenhuma resposta registrada.</Text>}
      {!!current.before && <Pressable accessibilityRole="button" onPress={() => load(undefined, true)} style={presentationStyles.inline2}><Text>Voltar às mais recentes</Text></Pressable>}
      {prepared.map(({
      row,
      view
    }) => <RegistroHistorico key={row.revisao} data={row.criadaEm} estado={row.revisao === (current.latest ?? revisao) ? 'Atual' : 'Anterior'} icone="time-outline" label="Respostas registradas" alteracoes={view.alteracoes} expanded={selected === row.revisao} onToggle={() => setSelected(selected === row.revisao ? null : row.revisao)}>
        {view.rows.map(line => <LinhaHistorica key={line.id} {...line} />)}
        {!!view.items.length && <Text style={styles.title}>Planejamento dos itens</Text>}
        {view.items.map(line => <LinhaHistorica key={line.id} {...line} />)}
        {!!view.ausentes.length && <Text style={styles.caption}>Sem resposta: {view.ausentes.join(', ')}.</Text>}
      </RegistroHistorico>)}
      {!current.loading && !current.error && current.next !== null && <Pressable accessibilityRole="button" onPress={() => load(current.next)} style={presentationStyles.inline3}>
          <Text>Ver revisões anteriores</Text>
        </Pressable>}
    </View>;
}
