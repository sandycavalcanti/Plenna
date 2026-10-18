import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(
  new URL('../src/utils/orcamento.js', import.meta.url),
  'utf8'
);

const { calcularOrcamento } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);

test('valor de atenção não aumenta orçamento mensal', () => {
  const resultado = calcularOrcamento({
    limiteMensal: 1500,
    valorMaximoCompra: 2000,
    categorias: [{ categoria_id: 1, limite: 1000 }],
    metaBloqueada: false,
  });

  assert.equal(resultado.tetoMensal, 1500);
  assert.equal(resultado.somaCategorias, 1000);
  assert.equal(resultado.sobraParaOutros, 500);
});

test('cadeado aberto aumenta orçamento quando categorias ultrapassam o teto', () => {
  const resultado = calcularOrcamento({
    limiteMensal: 1500,
    valorMaximoCompra: 300,
    categorias: [
      { categoria_id: 1, limite: 1200 },
      { categoria_id: 2, limite: 600 },
    ],
    metaBloqueada: false,
  });

  assert.equal(resultado.tetoMensal, 1800);
  assert.equal(resultado.somaCategorias, 1800);
  assert.equal(resultado.sobraParaOutros, 0);
});

test('cadeado fechado rejeita categorias acima do orçamento', () => {
  assert.throws(
    () => calcularOrcamento({
      limiteMensal: 1500,
      categorias: [
        { categoria_id: 1, limite: 1200 },
        { categoria_id: 2, limite: 600 },
      ],
      metaBloqueada: true,
    }),
    /ultrapassam o teto mensal/
  );
});

test('reduzir categoria não diminui orçamento automaticamente', () => {
  const resultado = calcularOrcamento({
    limiteMensal: 2000,
    categorias: [{ categoria_id: 1, limite: 500 }],
    metaBloqueada: false,
  });

  assert.equal(resultado.tetoMensal, 2000);
  assert.equal(resultado.sobraParaOutros, 1500);
});

test('redução manual do orçamento não é desfeita com cadeado aberto', () => {
  assert.throws(
    () => calcularOrcamento({
      limiteMensal: 1200,
      categorias: [
        { categoria_id: 1, limite: 1000 },
        { categoria_id: 2, limite: 500 },
      ],
      metaBloqueada: false,
      origemAlteracao: 'ORCAMENTO_MENSAL',
    }),
    /redistribuir|orçamento mensal/i
  );
});

test('Outros antigo não entra na soma das categorias nem aumenta orçamento', () => {
  const resultado = calcularOrcamento({
    limiteMensal: 2000,
    categorias: [
      { categoria_id: 2, limite: 800 },
      { categoria_id: 14, limite: 1500 },
    ],
    idCategoriaOutros: 14,
    metaBloqueada: false,
  });

  assert.equal(resultado.tetoMensal, 2000);
  assert.equal(resultado.somaCategorias, 800);
  assert.equal(resultado.sobraParaOutros, 1200);
  assert.deepEqual(
    resultado.categoriasValidas.map(c => c.categoria_id),
    [2]
  );
});
