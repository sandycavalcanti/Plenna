import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const telas = [
  'src/pages/SignUpScreen/index.js',
  'src/pages/EditPreferencesScreen/index.js',
];

for (const tela of telas) {
  test(`${tela}: utiliza metaMensal no payload de preferências`, () => {
    const codigo = readFileSync(tela, 'utf8');

    const bloco = codigo.match(
      /apiClient\.put\(['"]\/preferencia\/bulk['"],\s*\{([\s\S]*?)\}\);/
    );

    assert.ok(bloco, 'Endpoint de preferências não encontrado');

    assert.match(
      bloco[1],
      /categoriaId:\s*category\.categoria_id/
    );

    assert.match(
      bloco[1],
      /metaMensal:\s*category\.limite/
    );

    assert.doesNotMatch(
      bloco[1],
      /(?:^|[,{]\s*)limite\s*:/
    );
  });
}
