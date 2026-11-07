import { useCallback, useRef, useState } from 'react';
import { tokenStorage } from '../api/tokenStorage';
import {
  depositGoal,
  listGoalMovements,
  listGoals,
  prepareGoalMovement,
  withdrawGoal,
} from '../api/goals';

function normalizeGoalError(error) {
  return {
    status: error?.response?.status ?? null,
    code: error?.response?.data?.code ?? 'COMUNICACAO',
    message: error?.response?.data?.message ?? 'Não foi possível concluir a operação da meta.',
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

function mergeGoalSummary(goals, summary) {
  if (!summary?.meta_id) return goals;
  return goals.map((goal) => goal.meta_id === summary.meta_id
    ? { ...goal, ...summary }
    : goal);
}

export function useGoalSavings() {
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
      const response = await listGoals({
        signal: session.signal,
        rf017SessionId: session.id,
      });
      tokenStorage.assertSession(session.id);
      if (!Array.isArray(response.data)) throw new Error('INVALID_GOALS');
      if (run === request.current) {
        setState((current) => ({ ...current, metas: response.data, loading: false }));
      }
      return response.data;
    } catch (error) {
      if (run === request.current) {
        setState((current) => ({ ...current, loading: false, error: normalizeGoalError(error) }));
      }
      throw error;
    }
  }, []);

  const loadMovements = useCallback(async (metaId, options = {}) => {
    const session = await tokenStorage.captureSession();
    if (!session) throw new Error('SESSION_REQUIRED');
    tokenStorage.assertSession(session.id);
    try {
      const response = await listGoalMovements(metaId, {
        ...options,
        signal: session.signal,
        rf017SessionId: session.id,
      });
      tokenStorage.assertSession(session.id);
      if (!response.data || !Array.isArray(response.data.itens)) throw new Error('INVALID_GOAL_MOVEMENTS');
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
      throw normalizeGoalError(error);
    }
  }, []);

  const submitMovement = useCallback(async (metaId, operation, kind) => {
    const session = await tokenStorage.captureSession();
    if (!session) throw new Error('SESSION_REQUIRED');
    tokenStorage.assertSession(session.id);
    try {
      const response = kind === 'DEPOSITO'
        ? await depositGoal(metaId, operation, { signal: session.signal, rf017SessionId: session.id })
        : await withdrawGoal(metaId, operation, { signal: session.signal, rf017SessionId: session.id });
      tokenStorage.assertSession(session.id);
      const payload = response.data;
      if (!payload?.movimentacao || !payload?.meta) throw new Error('INVALID_GOAL_MOVEMENT');
      setState((current) => ({
        ...current,
        metas: mergeGoalSummary(current.metas, payload.meta),
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
      throw normalizeGoalError(error);
    }
  }, []);

  const prepare = useCallback((tipo, valor, operationId) => (
    prepareGoalMovement(tipo, valor, operationId)
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
