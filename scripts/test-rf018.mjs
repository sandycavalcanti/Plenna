import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Descobre somente os testes RF018 já presentes em cada etapa do histórico.
const nomes = new Set([
  'rf018Contratos', 'analiseAutomatica', 'avaliacaoContextual', 'contextoCompra',
  'descobertasCompra', 'gestaoCompra', 'historicoConsumo', 'revisaoIntegradaRf018',
  'rf018Experiencia', 'descobertasResumo',
]);
const arquivos = readdirSync('tests').filter(nome => nomes.has(nome.replace(/\.test\.mjs$/, ''))).map(nome => `tests/${nome}`);
const resultado = spawnSync(process.execPath, [
  '--import', './scripts/offline-network.mjs', '--experimental-vm-modules', '--test', ...arquivos,
], { stdio: 'inherit' });
process.exitCode = resultado.status ?? 1;
