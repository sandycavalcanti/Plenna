import { listarAplicativosTempoUso } from '../api/tempoUso';

const CATALOGO_TTL_MS = 60 * 60 * 1000;
let cache = null;
let consultaPendente = null;
let consultaSessao;

function validarCatalogo(resposta) {
  if (resposta?.versao !== 1 || !Array.isArray(resposta.aplicativos)) {
    throw new Error('Catálogo de aplicativos de compra inválido');
  }

  const packages = new Set();
  const aplicativos = resposta.aplicativos.map((app) => {
    if (
      typeof app?.packageId !== 'string' ||
      app.packageId.length > 255 ||
      !/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(app.packageId) ||
      typeof app.nomeApp !== 'string' ||
      !app.nomeApp.trim() ||
      packages.has(app.packageId)
    ) {
      throw new Error('Catálogo de aplicativos de compra inválido');
    }
    packages.add(app.packageId);
    return Object.freeze({ packageId: app.packageId, nomeApp: app.nomeApp });
  });

  return Object.freeze(aplicativos);
}

export function invalidarCatalogoAplicativosCompra() {
  cache = null;
}

export async function obterAplicativosCompra(config) {
  const idade = cache ? Date.now() - cache.obtidoEm : -1;
  if (cache && idade >= 0 && idade < CATALOGO_TTL_MS) {
    return cache.aplicativos;
  }

  if (!consultaPendente || consultaSessao !== config?.rf017SessionId) {
    cache = null;
    consultaSessao = config?.rf017SessionId;
    const consulta = listarAplicativosTempoUso(config)
      .then((resposta) => {
        const aplicativos = validarCatalogo(resposta);
        if (!config?.signal?.aborted) cache = { aplicativos, obtidoEm: Date.now() };
        return aplicativos;
      })
      .finally(() => {
        if (consultaPendente === consulta) consultaPendente = null;
      });
    consultaPendente = consulta;
  }

  return consultaPendente;
}
