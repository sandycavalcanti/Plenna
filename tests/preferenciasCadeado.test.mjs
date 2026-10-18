import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const telas = [
  'src/pages/SignUpScreen/index.js',
  'src/pages/EditPreferencesScreen/index.js',
];

for (const tela of telas) {
  test(`${tela}: preserva reduções graduais com cadeado fechado`, () => {
    const codigo = readFileSync(tela, 'utf8');
    const match = codigo.match(
      /const valorNovo = metaBloqueada[\s\S]*?: valorSolicitado;/
    );

    assert.ok(match, 'Regra do cadeado não encontrada');

    const calcular = new Function(
      'metaBloqueada',
      'valorSolicitado',
      'valorAnterior',
      'limiteGastoValor',
      'somaOutrasCategorias',
      `${match[0]}\nreturn valorNovo;`
    );

    assert.equal(calcular(true, 250, 300, 350, 200), 250);
    assert.equal(calcular(true, 350, 300, 350, 200), 300);
    assert.equal(calcular(true, 150, 300, 350, 200), 150);
    assert.equal(calcular(false, 350, 300, 350, 200), 350);
  });
}
