export const ACCESS_COLLECTOR_VERSION = 4;
export function accessEntry(quality, collectorVersion) {
  if (!(quality & 1)) return 'continuation';
  if (collectorVersion < 4 || collectorVersion == null) return 'unknown';
  if (quality & 256) return 'independent';
  if (quality & 512) return 'resumption';
  return 'unknown';
}
export function accessMetrics(accesses, collectorVersion = 4) {
  const entries = accesses.map(a => accessEntry(a.quality, a.collectorVersion ?? collectorVersion));
  return {
    observedIntervals: accesses.length,
    identifiedOpenings: entries.filter(e => e === 'independent').length,
    identifiedResumptions: entries.filter(e => e === 'resumption').length,
    unknownEntries: entries.filter(e => e === 'unknown').length
  };
}
export function accessQuality(quality, collectorVersion, scope = 'interval') {
  const entry = accessEntry(quality, collectorVersion);
  const labels = {
    independent: 'entrada independente observada',
    resumption: 'retomada identificada',
    unknown: 'natureza da entrada indeterminada',
    continuation: 'continuidade'
  };
  return [...(scope === 'interval' ? [labels[entry]] : []), ...[[1, 'inicio observado'], [2, 'termino observado'], [4, 'termino desconhecido'], [16, 'recorte de janela ou dia'], [32, 'lacuna de eventos'], [64, 'intervalo incompleto'], [128, 'relogio inconsistente'], [2048, 'tela nao interativa'], [4096, 'bloqueio'], [8192, 'completude da fonte nao verificada']].filter(([bit]) => quality & bit && (scope === 'interval' || ![1, 2].includes(bit))).map(([bit, label]) => collectorVersion < 4 && bit === 16 ? 'fronteira de origem indeterminada (coletor anterior)' : collectorVersion < 4 && bit === 64 ? 'qualidade parcial informada pelo coletor anterior' : label)].join(' · ');
}
