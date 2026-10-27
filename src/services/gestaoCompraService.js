export function moedaParaCentavos(text) {
  const value = String(text).trim();
  if (!/^\d+(?:[,.]\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.replace(',', '.').split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(result) && result > 0 ? result : null;
}
export function dataEfetiva(text) {
  if (!text.trim()) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!match) throw Error('Informe a data como dia/mês/ano.');
  const value = `${match[3]}-${match[2]}-${match[1]}`;
  if (
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    throw Error('Confira a data informada.');
  return value;
}
// Operações incertas ficam na memória da sessão para permitir reenvio idempotente sem persistência privada local.
const pendingBySession = new WeakMap();
function operacoes(session) {
  let map = pendingBySession.get(session.signal);
  if (!map) {
    map = new Map();
    pendingBySession.set(session.signal, map);
    session.signal.addEventListener('abort', () => map.clear(), { once: true });
  }
  return map;
}
export function confirmarOperacoesRecuperadas(session, compraId, eventos) {
  const map = operacoes(session);
  let count = 0;
  for (const [key, p] of map)
    if (
      key.startsWith(compraId + ':') &&
      eventos.some((e) => e.operacaoId === p.body.operacaoId)
    ) {
      map.delete(key);
      count++;
    }
  return count;
}
export function criarGravadorEvento({ client, storage, uuid, compraId }) {
  let pending, sessionId;
  return async (body) => {
    const { revisaoEsperada, ...intent } = body;
    const key =
      compraId +
      ':' +
      JSON.stringify(
        Object.fromEntries(
          Object.entries(intent).sort(([a], [b]) => a.localeCompare(b)),
        ),
      );
    const session = await storage.captureSession();
    if (!session) throw Error('Entre novamente para continuar.');
    if (sessionId !== undefined && sessionId !== session.id) {
      pending = undefined;
      throw Error('Entre novamente para continuar.');
    }
    sessionId = session.id;
    storage.assertSession(session.id);
    const map = operacoes(session);
    pending = map.get(key);
    if (!pending) {
      pending = { key, body: { ...body, operacaoId: uuid() } };
      map.set(key, pending);
    }
    let response;
    try {
      response = await client.post(
        `/v2/compras/${compraId}/eventos`,
        pending.body,
        { signal: session.signal, rf017SessionId: session.id, timeout: 15000 },
      );
    } catch (e) {
      if (e?.response?.status === 409) {
        map.delete(key);
        pending = undefined;
      }
      throw e;
    }
    storage.assertSession(session.id);
    const { data } = response;
    const e = data?.evento;
    if (
      data?.versaoContrato !== 1 ||
      data.compraId !== compraId ||
      data.persistido !== true ||
      !Number.isSafeInteger(e?.id) ||
      e.operacaoId !== pending.body.operacaoId ||
      e.revisao !== pending.body.revisaoEsperada + 1 ||
      e.tipo !== body.tipo ||
      e.itemId !== (body.itemId ?? null) ||
      e.dataEfetiva !== body.dataEfetiva ||
      e.corrigeEventoId !== (body.corrigeEventoId ?? null) ||
      e.anulado !== (body.anulado ?? false) ||
      Object.entries(body).some(
        ([k, v]) =>
          [
            'motivo',
            'quantidade',
            'valorCentavos',
            'oculto',
            'classificacao',
          ].includes(k) && e.dados?.[k] !== v,
      )
    )
      throw Error(
        'A API não confirmou a operação. Suas escolhas foram mantidas.',
      );
    map.delete(key);
    pending = undefined;
    return data;
  };
}
export function mensagemGestao(error) {
  const status = error?.response?.status;
  if (status === 401) return 'Entre novamente para continuar.';
  if (status === 409)
    return 'O histórico mudou. Atualize antes de tentar novamente.';
  if ([400, 422].includes(status))
    return error.response.data?.message || 'Confira os dados informados.';
  if (status === 503)
    return 'Esta operação ainda não está disponível neste ambiente.';
  if (status === 404) return 'Compra ou item indisponível.';
  if (
    error?.isAxiosError ||
    error?.message === 'Network Error' ||
    /^[A-Z_]+$/.test(error?.message ?? '')
  )
    return 'Sem confirmação. Tente novamente; suas escolhas foram mantidas.';
  return error?.response
    ? 'Não foi possível registrar agora. Tente novamente.'
    : error?.message ||
        'Sem confirmação. Tente novamente; suas escolhas foram mantidas.';
}
