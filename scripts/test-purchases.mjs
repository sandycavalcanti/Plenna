import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ["--import", "./scripts/offline-network.mjs", "--experimental-vm-modules", "--test", "tests/cicloVidaCompra.test.mjs", "tests/comprasConcorrencia.test.mjs", "tests/estadoCompra.test.mjs", "tests/filtrosHistorico.test.mjs", "tests/gestaoCompra.test.mjs", "tests/historicoComprasTela.test.mjs", "tests/historicoEventos.test.mjs", "tests/temporalCompras.test.mjs"], { stdio: 'inherit', windowsHide: true });
process.exitCode = result.status ?? 1;
