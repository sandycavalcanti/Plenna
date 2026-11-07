import * as Crypto from 'expo-crypto';
import { apiClient } from './client';

export const GOAL_MOVEMENT_DEFAULT_LIMIT = 20;
export const GOAL_MOVEMENT_MAX_LIMIT = 100;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONEY_PATTERN = /^\d{1,8}(?:\.\d{1,2})?$/;

function requireGoalId(metaId) {
  const parsed = Number(metaId);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new TypeError('metaId inválido');
  return parsed;
}

function requireOperationId(operationId) {
  if (typeof operationId !== 'string' || !UUID_PATTERN.test(operationId)) {
    throw new TypeError('operacao_id inválido');
  }
  return operationId;
}

function requireMovementValue(value) {
  const normalized = String(value ?? '').trim();
  if (!MONEY_PATTERN.test(normalized) || Number(normalized) <= 0) {
    throw new TypeError('valor de movimentação inválido');
  }
  return normalized;
}

function requireMovementType(tipo) {
  if (tipo !== 'DEPOSITO' && tipo !== 'RETIRADA') throw new TypeError('tipo de movimentação inválido');
  return tipo;
}

/**
 * Gera a chave de uma nova intenção. O chamador deve guardar o objeto
 * retornado e reutilizá-lo em retries da mesma submissão.
 */
export function prepareGoalMovement(tipo, valor, operationId = Crypto.randomUUID()) {
  return Object.freeze({
    tipo: requireMovementType(tipo),
    valor: requireMovementValue(valor),
    operacao_id: requireOperationId(operationId),
  });
}

export function listGoals(config = {}) {
  return apiClient.get('/goals', config);
}

export function createGoal(data, config = {}) {
  return apiClient.post('/goals', data, config);
}

export function updateGoal(metaId, data, config = {}) {
  return apiClient.put(`/goals/${encodeURIComponent(requireGoalId(metaId))}`, data, config);
}

export function checkGoal(metaId, completado, config = {}) {
  return apiClient.put('/goals/check', { meta_id: requireGoalId(metaId), completado: Boolean(completado) }, config);
}

export function deleteGoal(metaId, config = {}) {
  return apiClient.delete(`/goals/${encodeURIComponent(requireGoalId(metaId))}`, config);
}

export function listGoalMovements(metaId, { limit = GOAL_MOVEMENT_DEFAULT_LIMIT, cursor, ...config } = {}) {
  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > GOAL_MOVEMENT_MAX_LIMIT) {
    throw new TypeError('limit de movimentações inválido');
  }

  const params = { limit: parsedLimit };
  if (cursor !== undefined && cursor !== null && String(cursor).trim()) params.cursor = String(cursor).trim();
  return apiClient.get(`/goals/${encodeURIComponent(requireGoalId(metaId))}/movimentacoes`, { ...config, params: { ...(config.params || {}), ...params } });
}

function requirePreparedMovement(operation, tipo) {
  if (!operation || typeof operation !== 'object') throw new TypeError('operação de movimentação obrigatória');
  return prepareGoalMovement(tipo, operation.valor, operation.operacao_id);
}

/** O mesmo objeto de operação deve ser reutilizado quando a requisição falhar e for repetida. */
export function depositGoal(metaId, operation, config = {}) {
  return apiClient.post(`/goals/${encodeURIComponent(requireGoalId(metaId))}/movimentacoes`, requirePreparedMovement(operation, 'DEPOSITO'), config);
}

/** O mesmo objeto de operação deve ser reutilizado quando a requisição falhar e for repetida. */
export function withdrawGoal(metaId, operation, config = {}) {
  return apiClient.post(`/goals/${encodeURIComponent(requireGoalId(metaId))}/movimentacoes`, requirePreparedMovement(operation, 'RETIRADA'), config);
}
