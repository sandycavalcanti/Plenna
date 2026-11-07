// A importação não inicia coleta. Cada sessão executa um lote limitado por vez.
export function createMonitoringEngine(d) {
  let pending = null,
    owner = null,
    controller = null;
  const stop = () => {
    controller?.abort();
    d.cancelNative?.();
  };
  async function run({
    activate = false,
    expectedSessionId
  } = {}) {
    const session = await d.session();
    if (!session) throw new Error('SESSION_REQUIRED');
    if (expectedSessionId !== undefined && session.id !== expectedSessionId) throw new Error('SESSION_INVALIDATED');
    while (pending) {
      if (owner === session.id && !controller.signal.aborted) return pending;
      await pending.catch(() => {});
      d.assertSession(session.id);
    }
    owner = session.id;
    controller = new AbortController();
    const local = controller;
    const guard = () => {
      d.assertSession(session.id);
      if (d.consentChanging?.(session.id)) throw new Error('CONSENT_CHANGE_IN_PROGRESS');
      if (local.signal.aborted || session.signal.aborted || !d.active()) throw new Error('OPERATION_CANCELLED');
    };
    const abort = () => stop();
    session.signal.addEventListener('abort', abort);
    pending = (async () => {
      guard();
      if (!(await d.permission())) throw new Error('USAGE_ACCESS_REQUIRED');
      guard();
      const identity = await d.identity();
      guard();
      const request = {
        schemaVersion: 3,
        installationId: identity.id,
        sessionId: identity.clientSession,
        expectedContextId: identity.contextId ?? null,
        timezone: d.timezone(),
        activate
      };
      let reply = await d.prepare(request, identity, session, local.signal);
      guard();
      if (reply.activationChallenge && activate) {
        reply = await d.prepare({
          ...request,
          activationProof: reply.activationChallenge
        }, identity, session, local.signal);
        guard();
      }
      if (reply.schemaVersion !== 3 || reply.timezone !== d.timezone() || !Array.isArray(reply.windows) || !Array.isArray(reply.catalog) || reply.windows.length > 3 || reply.catalog.length > 30) throw new Error('INVALID_PREPARATION');
      await d.remember(identity, reply);
      guard();
      if (!reply.windows.length) return {
        schemaVersion: 3,
        reason: 'NO_ELIGIBLE_INTERVAL'
      };
      const native = await d.collect(reply.windows.map(w => ({
        start: Date.parse(w.start),
        end: Date.parse(w.end)
      })), reply.catalog.map(p => p.packageId), Date.parse(reply.eligibleFrom), reply.detailedAccessAllowed === true);
      guard();
      if (!(await d.permission())) throw new Error('USAGE_ACCESS_REQUIRED');
      guard();
      if (d.timezone() !== reply.timezone) throw new Error('TIMEZONE_VALIDATION_REQUIRED');
      if (!Array.isArray(native) || native.length !== reply.windows.length) throw new Error('INVALID_NATIVE_RESPONSE');
      const observations = [];
      for (let i = 0; i < reply.windows.length; i++) {
        const w = reply.windows[i],
          result = native[i];
        if (!['AVAILABLE', 'UNAVAILABLE'].includes(result?.sourceStatus)) throw new Error('INVALID_NATIVE_RESPONSE');
        if (result.sourceStatus === 'AVAILABLE' && result.collectorVersion !== 4) throw new Error('RF017_COLLECTOR_4_NATIVE_REQUIRED');
        if (result.sourceStatus === 'AVAILABLE' && (!Array.isArray(result.applications) || result.applications.length !== reply.catalog.length || new Set(result.applications.map(a => a.packageId)).size !== reply.catalog.length)) throw new Error('INVALID_NATIVE_RESPONSE');
        for (const p of reply.catalog) {
          const previous = reply.previous.find(v => v.localDate === w.localDate && v.packageId === p.packageId);
          const base = {
            localDate: w.localDate,
            packageId: p.packageId,
            expectedVersion: previous?.version ?? 0,
            interval: {
              start: w.start,
              end: w.end
            },
            collectorVersion: 4,
            corrections: []
          };
          if (result.sourceStatus === 'UNAVAILABLE') {
            observations.push({
              ...base,
              status: 'UNAVAILABLE',
              durationMs: null,
              quality: 64,
              accesses: []
            });
            continue;
          }
          const app = result.applications.find(a => a.packageId === p.packageId);
          if (!app || !Number.isSafeInteger(app.durationMs) || app.durationMs < 0 || !Number.isInteger(app.quality) || !Array.isArray(app.accesses)) throw new Error('INVALID_NATIVE_RESPONSE');
          const accesses = app.accesses.map(a => ({
            origin: new Date(a.origin).toISOString(),
            start: new Date(a.start).toISOString(),
            end: a.end === null ? null : new Date(a.end).toISOString(),
            quality: a.quality
          }));
          // Eventos expirados no Android não autorizam reduzir um total já confirmado.
          if (previous?.durationMs != null && app.durationMs < previous.durationMs) {
            observations.push({
              ...base,
              status: 'UNAVAILABLE',
              durationMs: null,
              quality: 96,
              accesses: []
            });
            continue;
          }
          observations.push({
            ...base,
            status: 'AVAILABLE',
            durationMs: app.durationMs,
            quality: app.quality,
            accesses: reply.detailedAccessAllowed ? accesses : []
          });
        }
      }
      const body = {
        schemaVersion: 3,
        installationId: identity.id,
        sessionId: identity.clientSession,
        contextId: reply.contextId,
        collectionId: reply.collectionId,
        observations
      };
      if (JSON.stringify(body).length > 450000) throw new Error('BATCH_TOO_LARGE');
      guard();
      let response;
      try {
        response = await d.submit(body, identity, session, local.signal);
      } catch (error) {
        guard();
        if (error?.response) throw error;
        response = await d.submit(body, identity, session, local.signal);
      }
      guard();
      if (response?.schemaVersion !== 3 || !Array.isArray(response.results) || response.results.length !== observations.length || new Set(response.results.map(r => r.localDate + '/' + r.packageId)).size !== observations.length || response.results.some(r => !Number.isSafeInteger(r.version) || r.version < 1 || !['APPLIED', 'DUPLICATE'].includes(r.status) || !observations.some(o => o.localDate === r.localDate && o.packageId === r.packageId))) throw new Error('INVALID_INGESTION_RESPONSE');
      d.updated();
      return response;
    })().finally(() => {
      session.signal.removeEventListener('abort', abort);
      pending = null;
      owner = null;
    });
    return pending;
  }
  return {
    run,
    stop
  };
}
