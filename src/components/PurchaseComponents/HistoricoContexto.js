import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import { validarContexto } from '../../services/contextoCompraService';
const questions = {
  planejamento: 'Planejamento da compra',
  influenciaPromocional: 'Influência de promoção',
  necessidadeInesperada: 'Necessidade inesperada',
  momento: 'Momento da compra',
  autopercepcaoImpulsividade: 'Autopercepção de impulso',
};
const labels = {
  SIM: 'Sim',
  NAO: 'Não',
  PARCIALMENTE: 'Em parte',
  NAO_LEMBRO: 'Não lembro',
  PREFIRO_NAO_RESPONDER: 'Prefiro não responder',
  ANTECIPADA: 'Antecipada',
  ADIADA: 'Adiada',
  NO_MOMENTO_PREVISTO: 'No momento previsto',
};
export default function HistoricoContexto({ compraId, revisao }) {
  const [state, setState] = useState({
    rows: [],
    loading: true,
    error: false,
    next: null,
  });
  const [retry, setRetry] = useState(0);
  const owner = useRef(null),
    busy = useRef(false);
  useEffect(() => {
    let alive = true,
      session,
      clear;
    busy.current = false;
    owner.current = { id: compraId, revisao, alive: () => alive };
    setState({ rows: [], loading: true, error: false, next: null });
    (async () => {
      try {
        session = await tokenStorage.captureSession();
        if (!session) throw Error('SESSION');
        clear = () => {
          alive = false;
          setState({ rows: [], loading: false, error: true, next: null });
        };
        session.signal.addEventListener('abort', clear, { once: true });
        if (alive) {
          owner.current.session = session;
          await load(null, true);
        }
      } catch {
        if (alive)
          setState({ rows: [], loading: false, error: true, next: null });
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
    setState((s) => ({ ...s, loading: true, error: false }));
    try {
      const session = scope.session;
      tokenStorage.assertSession(session.id);
      const { data } = await apiClient.get(
        `/v2/compras/${scope.id}/contexto/historico`,
        {
          params: antes ? { antes } : {},
          signal: session.signal,
          rf017SessionId: session.id,
        },
      );
      tokenStorage.assertSession(session.id);
      if (
        data?.versaoContrato !== 1 ||
        data.compraId !== scope.id ||
        !Array.isArray(data.revisoes) ||
        data.revisoes.length > 50 ||
        !(
          data.proximaAntes === null ||
          (Number.isInteger(data.proximaAntes) && data.proximaAntes > 0)
        )
      )
        throw Error('HISTORY');
      const rows = data.revisoes.map((row) => validarContexto(row, scope.id));
      if (
        rows.some(
          (r, i) =>
            r.revisao < 1 ||
            (antes && r.revisao >= antes) ||
            (i > 0 && r.revisao >= rows[i - 1].revisao),
        ) ||
        (data.proximaAntes !== null &&
          data.proximaAntes !== rows.at(-1)?.revisao)
      )
        throw Error('HISTORY');
      if (scope === owner.current && scope.alive())
        setState((s) => ({
          rows: replace ? rows : [...s.rows, ...rows],
          loading: false,
          error: false,
          next: data.proximaAntes,
        }));
    } catch {
      if (scope === owner.current && scope.alive())
        setState((s) => ({ ...s, loading: false, error: true }));
    } finally {
      if (scope === owner.current) busy.current = false;
    }
  }
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: '#655A70' }}>
        Respostas declaradas por você, preservadas por revisão. Os itens são
        identificados pelo registro original.
      </Text>
      {state.loading && (
        <ActivityIndicator accessibilityLabel="Carregando revisões" />
      )}
      {state.error && (
        <>
          <Text accessibilityRole="alert">
            Não foi possível consultar as revisões.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              owner.current?.session
                ? load(state.next, !state.rows.length)
                : setRetry((n) => n + 1)
            }
            style={{ minHeight: 48, justifyContent: 'center' }}
          >
            <Text>Tentar novamente</Text>
          </Pressable>
        </>
      )}
      {!state.loading && !state.error && !state.rows.length && (
        <Text>Nenhuma resposta registrada.</Text>
      )}
      {state.rows.map((row) => (
        <View
          key={row.revisao}
          style={{
            gap: 5,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: '#EEE4F2',
          }}
        >
          <Text style={{ fontWeight: '600', color: '#594367' }}>
            Revisão {row.revisao}
            {row.revisao === revisao ? ' · atual' : ' · histórica'}
          </Text>
          <Text>{new Date(row.criadaEm).toLocaleString('pt-BR')}</Text>
          {Object.entries(questions).map(([field, label]) => (
            <Text key={field}>
              {label}: {labels[row.respostas[field]] ?? 'Não informada'}
            </Text>
          ))}
          {row.itens.map((item) => (
            <Text key={item.itemId}>
              Item #{item.itemId} · planejamento: {labels[item.planejamento]}
            </Text>
          ))}
          {!!row.eventosPosteriores?.length && (
            <Text>
              Declarações posteriores:{' '}
              {row.eventosPosteriores
                .map(
                  (e) =>
                    ({
                      CANCELAMENTO: 'cancelamento',
                      DEVOLUCAO: 'devolução',
                      REEMBOLSO: 'reembolso',
                      ARREPENDIMENTO: 'arrependimento',
                    })[e],
                )
                .join(', ')}
            </Text>
          )}
        </View>
      ))}
      {!state.loading && !state.error && state.next !== null && (
        <Pressable
          accessibilityRole="button"
          onPress={() => load(state.next)}
          style={{ minHeight: 48, justifyContent: 'center' }}
        >
          <Text>Ver revisões anteriores</Text>
        </Pressable>
      )}
    </View>
  );
}
