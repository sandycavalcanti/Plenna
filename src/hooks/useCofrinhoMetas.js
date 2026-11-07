import { useCallback, useRef, useState } from 'react';
import { tokenStorage } from '../api/tokenStorage';
import {
  depositarNaMeta,
  listarMovimentacoesMeta,
  listarMetas,
  prepararMovimentacaoMeta,
  retirarDaMeta,
} from '../api/metas';
import { normalizarRespostaMetas } from '../utils/metaContract';

export function normalizarErroMeta(error, metaId = null) {
  const body = error?.response?.data ?? {};
  const routeNotFound = error?.response?.status === 404 && body?.error === 'Route not found' && !body?.code;
  const diagnostico = {
    baseURL: error?.config?.baseURL ?? null,
    url: error?.config?.url ?? null,
    method: error?.config?.method ?? null,
    metaId: metaId ?? null,
    status: error?.response?.status ?? null,
    backendCode: body?.code ?? null,
  };
  return {
    status: error?.response?.status ?? null,
    code: body?.code ?? (routeNotFound ? 'ROTA_NAO_ENCONTRADA' : 'COMUNICACAO'),
    message: error?.response?.data?.message ?? 'Não foi possível concluir a operação da meta.',
    routeNotFound,
    diagnostico,
    cause: error,
  };
}

function mergeMovements(existing, incoming) {
  const byId = new Map();
  [...existing, ...incoming].forEach((item) => {
    if (item?.meta_movimentacao_id !== undefined) byId.set(item.meta_movimentacao_id, item);
  });
  return [...byId.values()];
}

function mesclarResumoMeta(metas, summary) {
  if (!summary?.meta_id) return metas;
  return metas.map((meta) => meta.meta_id === summary.meta_id
    ? { ...meta, ...summary }
    : meta);
}

export function useCofrinhoMetas() {
  const [state, setState] = useState({
    metas: [],
    movimentacoes: {},
    loading: false,
    error: null,
  });
  const request = useRef(0);

  const refresh = useCallback(async () => {
    const run = ++request.current;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const session = await tokenStorage.captureSession();
      if (!session) throw new Error('SESSION_REQUIRED');
      tokenStorage.assertSession(session.id);
      const response = await listarMetas({
        signal: session.signal,
        rf017SessionId: session.id,
      });
      tokenStorage.assertSession(session.id);
      const metas = normalizarRespostaMetas(response.data);
      if (run === request.current) {
        setState((current) => ({ ...current, metas, loading: false }));
      }
      return metas;
    } catch (error) {
      if (run === request.current) {
        setState((current) => ({ ...current, loading: false, error: normalizarErroMeta(error) }));
      }
      throw error;
    }
  }, []);

  const loadMovements = useCallback(async (metaId, options = {}) => {
    const session = await tokenStorage.captureSession();
    if (!session) throw new Error('SESSION_REQUIRED');
    tokenStorage.assertSession(session.id);
    try {
      const response = await listarMovimentacoesMeta(metaId, {
        ...options,
        signal: session.signal,
        rf017SessionId: session.id,
      });
      tokenStorage.assertSession(session.id);
      if (!response.data || !Array.isArray(response.data.itens)) throw new Error('INVALID_META_MOVEMENTS');
      setState((current) => ({
        ...current,
        movimentacoes: {
          ...current.movimentacoes,
          [metaId]: {
            itens: options.cursor
              ? mergeMovements(current.movimentacoes[metaId]?.itens ?? [], response.data.itens)
              : mergeMovements([], response.data.itens),
            nextCursor: response.data.nextCursor ?? null,
          },
        },
      }));
      return response.data;
    } catch (error) {
      throw normalizarErroMeta(error, metaId);
    }
  }, []);

  const submitMovement = useCallback(async (metaId, operation, kind) => {
    const session = await tokenStorage.captureSession();
    if (!session) throw new Error('SESSION_REQUIRED');
    tokenStorage.assertSession(session.id);
    try {
      const response = kind === 'DEPOSITO'
        ? await depositarNaMeta(metaId, operation, { signal: session.signal, rf017SessionId: session.id })
        : await retirarDaMeta(metaId, operation, { signal: session.signal, rf017SessionId: session.id });
      tokenStorage.assertSession(session.id);
      const payload = response.data;
      if (!payload?.movimentacao || !payload?.meta) throw new Error('INVALID_META_MOVEMENT');
      setState((current) => ({
        ...current,
        metas: mesclarResumoMeta(current.metas, payload.meta),
        movimentacoes: {
          ...current.movimentacoes,
          [metaId]: {
            itens: [
              payload.movimentacao,
              ...(current.movimentacoes[metaId]?.itens ?? [])
                .filter((item) => item.meta_movimentacao_id !== payload.movimentacao.meta_movimentacao_id),
            ],
            nextCursor: current.movimentacoes[metaId]?.nextCursor ?? null,
          },
        },
        error: null,
      }));
      return payload;
    } catch (error) {
      throw normalizarErroMeta(error, metaId);
    }
  }, []);

  const prepare = useCallback((tipo, valor, operationId) => (
    prepararMovimentacaoMeta(tipo, valor, operationId)
  ), []);

  const deposit = useCallback((metaId, operation) => (
    submitMovement(metaId, operation, 'DEPOSITO')
  ), [submitMovement]);

  const withdraw = useCallback((metaId, operation) => (
    submitMovement(metaId, operation, 'RETIRADA')
  ), [submitMovement]);

  return {
    ...state,
    refresh,
    loadMovements,
    prepare,
    deposit,
    withdraw,
  };
}
