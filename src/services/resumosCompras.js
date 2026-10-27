import { apiClient } from '../api/client';
import { tokenStorage } from '../api/tokenStorage';
export async function consultarResumosCompras(compras) {
  const session = await tokenStorage.captureSession();
  if (!session) throw Error('SESSION_REQUIRED');
  const ids = compras.map((c) => c.compra_id),
    chunks = [];
  for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100));
  const replies = await Promise.all(
    chunks.map(async (ids) => {
      const { data } = await apiClient.get('/v2/compras/resumos', {
        params: { ids: ids.join(',') },
        signal: session.signal,
        rf017SessionId: session.id,
      });
      tokenStorage.assertSession(session.id);
      if (
        data?.versaoContrato !== 1 ||
        !Array.isArray(data.resumos) ||
        // Uma resposta parcial não pode fazer compras desaparecerem silenciosamente da listagem.
        data.resumos.length !== ids.length ||
        new Set(data.resumos.map((r) => r.compraId)).size !==
          data.resumos.length ||
        data.resumos.some((r) => !ids.includes(r.compraId))
      )
        throw Error('INVALID_PURCHASE_SUMMARIES');
      return data.resumos;
    }),
  );
  tokenStorage.assertSession(session.id);
  return Object.fromEntries(replies.flat().map((r) => [r.compraId, r]));
}
