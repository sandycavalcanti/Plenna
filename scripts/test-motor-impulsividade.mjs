import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const selected = new Set(["analiseCompra", "avaliacaoExplicacao", "decisaoAnalise", "dimensoesAnalise", "insightsContextuais", "avaliacaoContextual", "contextoCompra", "historicoAvaliacoes", "historicosContextuais", "panoramaComportamento", "panoramaCompras", "panoramaRefinamento", "usoContextual", "analiseAutomatica", "historicoConsumo", "revisaoAnaliseContextual"]);
const files = readdirSync('tests').filter(name => selected.has(name.replace(/\.test\.mjs$/,''))).map(name => `tests/${name}`);
const result = spawnSync(process.execPath, ['--import','./scripts/offline-network.mjs','--experimental-vm-modules', '--test', ...files], { stdio: 'inherit', windowsHide: true });
process.exitCode = result.status ?? 1;
