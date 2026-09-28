import { hasUsageAccess, getForegroundUsage } from '../../modules/plenna-usage-stats';
import {
  obterJanelasRecuperacaoTempoUso, mesmoDiaLocal, montarPayloadTempoUsoDiario,
} from '../utils/tempoUsoSync';
import { sincronizarTempoUso } from '../api/tempoUso';
import {
  listarConsentimentos, monitoramentoEmAlteracao, observarAlteracaoMonitoramento,
} from '../api/consentimento';
import {
  obterAplicativosCompra, invalidarCatalogoAplicativosCompra,
} from './aplicativosCompraService';
import { tokenStorage } from '../api/tokenStorage';

let execucaoPendente = null;
// Só metadados da última preparação; nenhum dado de uso ou token é persistido.
let ultimaPreparacao = null;
const COOLDOWN_MS = 15 * 60 * 1000;

observarAlteracaoMonitoramento(sessaoId => {
  if (ultimaPreparacao?.id === sessaoId) ultimaPreparacao = null;
  if (execucaoPendente?.id === sessaoId) {
    execucaoPendente.motivo = 'consentimento_alterado';
    execucaoPendente.controller.abort();
  }
});

function interromper(motivo) {
  const error = new Error(motivo);
  error.rf017Motivo = motivo;
  throw error;
}

function verificarOperacao(execucao) {
  tokenStorage.assertSession(execucao.id);
  if (execucao.controller.signal.aborted) interromper(execucao.motivo ?? 'operacao_cancelada');
  if (monitoramentoEmAlteracao(execucao.id)) interromper('consentimento_em_alteracao');
}

async function verificarCondicoes(execucao, config) {
  verificarOperacao(execucao);
  const consentimentos = await listarConsentimentos(config);
  verificarOperacao(execucao);
  const ativo = consentimentos.some(item =>
    (item?.tb_consentimento_tipo?.consentimento_tipo_codigo ?? item?.consentimento_tipo_codigo)
      === 'MONITORAMENTO_TEMPO_USO' && item.consentimento_status === true);
  if (!ativo) interromper('consentimento_inativo');
  const permitido = await hasUsageAccess();
  verificarOperacao(execucao);
  if (!permitido) interromper('usage_access_nao_concedido');
}

// Mantém uma única consulta nativa em andamento, inclusive ao trocar de conta.
// O Kotlin não é abortável: aguarda seu término e descarta resultados cancelados.
export async function sincronizarTempoUsoDoDia(sessaoEsperada, { signal } = {}) {
  let sessao;
  try {
    sessao = sessaoEsperada ?? await tokenStorage.captureSession();
    if (!sessao) return { sincronizado: false, motivo: 'sem_token' };
    tokenStorage.assertSession(sessao.id);
    if (signal?.aborted || sessao.signal.aborted) return { sincronizado: false, motivo: 'operacao_cancelada' };
  } catch (error) {
    if (error?.code === 'RF017_SESSION_INVALIDATED') return { sincronizado: false, motivo: 'sessao_invalidada' };
    throw error;
  }
  if (execucaoPendente) {
    if (execucaoPendente.id === sessao.id && !execucaoPendente.controller.signal.aborted) {
      return execucaoPendente.promise;
    }
    await execucaoPendente.promise.catch(() => {});
    return sincronizarTempoUsoDoDia(sessao, { signal });
  }

  const execucao = { id: sessao.id, controller: new AbortController(), promise: null };
  const cancelarSessao = () => {
    execucao.motivo = 'sessao_invalidada';
    execucao.controller.abort();
    if (ultimaPreparacao?.id === sessao.id) ultimaPreparacao = null;
  };
  const cancelar = () => {
    execucao.motivo = 'operacao_cancelada';
    execucao.controller.abort();
  };
  sessao.signal.addEventListener('abort', cancelarSessao);
  signal?.addEventListener('abort', cancelar);
  execucaoPendente = execucao;
  execucao.promise = executarPreparacao(execucao).catch(error => {
    if (execucao.controller.signal.aborted || error?.rf017Motivo || error?.code === 'RF017_SESSION_INVALIDATED') {
      if (ultimaPreparacao?.id === sessao.id) ultimaPreparacao = null;
      return { sincronizado: false, motivo: execucao.motivo ?? error.rf017Motivo ?? 'sessao_invalidada' };
    }
    throw error;
  }).finally(() => {
    sessao.signal.removeEventListener('abort', cancelarSessao);
    signal?.removeEventListener('abort', cancelar);
    if (execucaoPendente === execucao) execucaoPendente = null;
  });
  return execucao.promise;
}

async function executarPreparacao(execucao) {
  const config = { rf017SessionId: execucao.id, signal: execucao.controller.signal };
  await verificarCondicoes(execucao, config);
  const agora = new Date();
  if (ultimaPreparacao?.id === execucao.id &&
      mesmoDiaLocal(new Date(ultimaPreparacao.em), agora) &&
      agora.getTime() >= ultimaPreparacao.em && agora.getTime() - ultimaPreparacao.em < COOLDOWN_MS) {
    return { sincronizado: false, motivo: 'cooldown_ativo' };
  }
  const aplicativos = await obterAplicativosCompra(config);
  verificarOperacao(execucao);

  let payload;
  let referencia;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    referencia = new Date();
    payload = { schemaVersion: 1, registros: [] };
    for (const janela of obterJanelasRecuperacaoTempoUso(referencia)) {
      // Reconsulta a API imediatamente antes de cada janela de coleta.
      await verificarCondicoes(execucao, config);
      if (!mesmoDiaLocal(referencia, new Date())) break;
      const uso = janela.fimColeta > janela.inicio
        ? await getForegroundUsage(janela.inicio.getTime(), janela.fimColeta.getTime())
        : [];
      // Revogação local aborta; revogação remota é detectada pela nova consulta.
      await verificarCondicoes(execucao, config);
      if (!mesmoDiaLocal(referencia, new Date())) break;
      payload.registros.push(...montarPayloadTempoUsoDiario(uso, janela.inicio, aplicativos).registros);
    }
    if (mesmoDiaLocal(referencia, new Date())) break;
    payload = null;
  }
  if (!payload) return { sincronizado: false, motivo: 'dia_alterado' };
  await verificarCondicoes(execucao, config);
  if (!mesmoDiaLocal(referencia, new Date())) return { sincronizado: false, motivo: 'dia_alterado' };
  if (!payload.registros.length) {
    ultimaPreparacao = { id: execucao.id, em: Date.now() };
    return { sincronizado: false, motivo: 'sem_registros', quantidade: 0 };
  }

  let resultado;
  try {
    resultado = await sincronizarTempoUso(payload, config);
    verificarOperacao(execucao);
  } catch (error) {
    if (!config.signal.aborted && error?.response?.status === 422) invalidarCatalogoAplicativosCompra();
    throw error;
  }
  ultimaPreparacao = { id: execucao.id, em: Date.now() };
  return {
    sincronizado: !resultado?.bloqueadoNoLaboratorio,
    motivo: resultado?.bloqueadoNoLaboratorio ? 'envio_bloqueado_no_laboratorio' : null,
    quantidade: payload.registros.length,
    dataReferencia: referencia.getTime(),
    resultado,
  };
}
