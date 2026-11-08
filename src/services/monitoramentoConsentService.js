import { usageMonitoringEnabled } from '../api/usageMonitoringPolicy';

// Compartilha o consentimento sem acoplar o formulário ao coletor nativo.
export async function alterarConsentimentoMonitoramento(value, session, registrarConsentimento, assertSession) {
  assertSession(session.id);
  await registrarConsentimento('MONITORAMENTO_TEMPO_USO', value, {
    usageMonitoringSessionId: session.id,
    signal: session.signal
  });
  assertSession(session.id);
  let activationPending = false;
  if (value && usageMonitoringEnabled) {
    try {
      const {
        prepareUsageMonitoringActivation,
        synchronizeUsageMonitoring
      } = await import('./usageMonitoringService');
      assertSession(session.id);
      await prepareUsageMonitoringActivation(session);
      synchronizeUsageMonitoring().catch(() => {});
    } catch {
      // Falha ao preparar o aparelho não desfaz um consentimento já salvo.
      assertSession(session.id);
      activationPending = true;
    }
  }
  return {
    consentConfirmed: true,
    activationPending
  };
}
