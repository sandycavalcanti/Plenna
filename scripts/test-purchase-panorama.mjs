import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ["--import", "./scripts/offline-network.mjs", "--experimental-vm-modules", "--test", "tests/dashboardContrato.test.mjs", "tests/panoramaComportamento.test.mjs", "tests/panoramaCompras.test.mjs", "tests/panoramaRefinamento.test.mjs", "tests/panoramaFinanceiro.test.mjs", "tests/meiaLuaHome.test.mjs", "tests/resumoFinanceiro.test.mjs"], { stdio: 'inherit', windowsHide: true });
process.exitCode = result.status ?? 1;
