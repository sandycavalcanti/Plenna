import * as Crypto from 'expo-crypto';
import { apiClient } from './client';
import { prepararPayloadMeta } from '../utils/metaMoney';

export { prepararPayloadMeta } from '../utils/metaMoney';

export const LIMITE_PADRAO_MOVIMENTACOES_META = 20;
export const LIMITE_MAXIMO_MOVIMENTACOES_META = 100;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONEY_PATTERN = /^\d{1,8}(?:\.\d{1,2})?$/;

function exigirIdMeta(metaId) {
  const parsed = Number(metaId);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new TypeError('metaId inválido');
  return parsed;
}

function exigirIdOperacao(operacaoId) {
  if (typeof operacaoId !== 'string' || !UUID_PATTERN.test(operacaoId)) throw new TypeError('operacao_id inválido');
  return operacaoId;
}

function exigirValorMovimentacao(value) {
  const normalized = String(value ?? '').trim();
  if (!MONEY_PATTERN.test(normalized) || Number(normalized) <= 0) throw new TypeError('valor de movimentação inválido');
  return normalized;
}

function exigirTipoMovimentacao(tipo) {
  if (tipo !== 'DEPOSITO' && tipo !== 'RETIRADA') throw new TypeError('tipo de movimentação inválido');
  return tipo;
}

/** Gera uma intenção. O mesmo objeto deve ser reutilizado em retries. */
export function prepararMovimentacaoMeta(tipo, valor, operacaoId = Crypto.randomUUID()) {
  return Object.freeze({
    tipo: exigirTipoMovimentacao(tipo),
    valor: exigirValorMovimentacao(valor),
    operacao_id: exigirIdOperacao(operacaoId),
  });
}

export function listarMetas(config = {}) {
  return apiClient.get('/metas', config);
}

export function listarMetasHistorico(periodo, config = {}) {
  if (typeof periodo !== 'string' || !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(periodo)) throw new TypeError('período de metas inválido');
  return apiClient.get('/metas/historico', {
    ...config,
    params: { ...(config.params || {}), periodo },
  });
}

export function criarMeta(data, config = {}) {
  return apiClient.post('/metas', prepararPayloadMeta(data), config);
}

export function atualizarMeta(metaId, data, config = {}) {
  return apiClient.put(`/metas/${encodeURIComponent(exigirIdMeta(metaId))}`, prepararPayloadMeta(data), config);
}

export function concluirMeta(metaId, completado, config = {}) {
  return apiClient.put('/metas/check', { meta_id: exigirIdMeta(metaId), completado: Boolean(completado) }, config);
}

export function excluirMeta(metaId, config = {}) {
  return apiClient.delete(`/metas/${encodeURIComponent(exigirIdMeta(metaId))}`, config);
}

export function listarMovimentacoesMeta(metaId, { limit = LIMITE_PADRAO_MOVIMENTACOES_META, cursor, ...config } = {}) {
  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > LIMITE_MAXIMO_MOVIMENTACOES_META) throw new TypeError('limit de movimentações inválido');
  const params = { limit: parsedLimit };
  if (cursor !== undefined && cursor !== null && String(cursor).trim()) params.cursor = String(cursor).trim();
  return apiClient.get(`/metas/${encodeURIComponent(exigirIdMeta(metaId))}/movimentacoes`, { ...config, params: { ...(config.params || {}), ...params } });
}

function exigirMovimentacaoPreparada(operation, tipo) {
  if (!operation || typeof operation !== 'object') throw new TypeError('operação de movimentação obrigatória');
  const preparada = prepararMovimentacaoMeta(operation.tipo, operation.valor, operation.operacao_id);
  if (preparada.tipo !== tipo) throw new TypeError('tipo da operação de movimentação incompatível');
  return preparada;
}

export function depositarNaMeta(metaId, operation, config = {}) {
  return apiClient.post(`/metas/${encodeURIComponent(exigirIdMeta(metaId))}/movimentacoes`, exigirMovimentacaoPreparada(operation, 'DEPOSITO'), config);
}

export function retirarDaMeta(metaId, operation, config = {}) {
  return apiClient.post(`/metas/${encodeURIComponent(exigirIdMeta(metaId))}/movimentacoes`, exigirMovimentacaoPreparada(operation, 'RETIRADA'), config);
}
