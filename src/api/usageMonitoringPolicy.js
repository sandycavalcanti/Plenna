// O modo de homologação é apenas diagnóstico; não concede consentimento nem libera lotes.
export const usageMonitoringHomologationEnabled =
  typeof __DEV__ !== 'undefined' && __DEV__ &&
  typeof process !== 'undefined' &&
  process.env.EXPO_PUBLIC_USAGE_MONITORING_HOMOLOGATION === '1';
// A nova configuração é explícita: ausência não habilita coleta nem leitura v2.
export const usageMonitoringEnabled =
  typeof process !== 'undefined' &&
  process.env.EXPO_PUBLIC_USAGE_MONITORING_ENABLED === 'true';
export const usageMonitoringReadsEnabled =
  typeof process !== 'undefined' &&
  process.env.EXPO_PUBLIC_USAGE_MONITORING_READS_ENABLED === 'true';
