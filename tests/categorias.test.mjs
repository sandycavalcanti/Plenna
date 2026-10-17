import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/utils/categorias.js', import.meta.url), 'utf8');
const { obterIdCategoriaOutros, distribuirSobraEmOutros } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
for (const id of [14, 27]) test(`Outros usa ID real ${id}`, () => {
 const catalogo=[{categoria_id:id,categoria_nome:'  OUTROS  '}];
 assert.equal(obterIdCategoriaOutros(catalogo),id);
 assert.deepEqual(distribuirSobraEmOutros([],catalogo,30),[{categoria_id:id,categoria_nome:'  OUTROS  ',limite:30}]);
});
test('ID 14 de outra categoria permanece intacto e sobra vai para Outros',()=>{
 const selected=[{categoria_id:14,limite:20}];
 const result=distribuirSobraEmOutros(selected,[{categoria_id:14,categoria_nome:'Alimentos'},{categoria_id:3,categoria_nome:'Outros'}],10);
 assert.equal(result[0].limite,20);assert.equal(result[1].categoria_id,3);assert.deepEqual(selected,[{categoria_id:14,limite:20}]);
});
test('sobra substitui limite existente sem modificar seleção original',()=>{
 const selected=[{categoria_id:7,limite:25}];
 assert.equal(distribuirSobraEmOutros(selected,[{categoria_id:7,categoria_nome:'Outros'}],12.5)[0].limite,12.5);
 assert.equal(selected[0].limite,25);
});
test('Outros ausente impede distribuição',()=>assert.throws(()=>distribuirSobraEmOutros([],[],20),/ausente/));
test('Outros duplicada impede distribuição',()=>assert.throws(()=>obterIdCategoriaOutros([{categoria_id:1,categoria_nome:'Outros'},{categoria_id:2,categoria_nome:' outros '}]),/duplicada/));
test('ID inválido recusado',()=>assert.throws(()=>obterIdCategoriaOutros([{categoria_id:0,categoria_nome:'Outros'}]),/inválido/));
test('sem sobra n?o exige Outros',()=>assert.deepEqual(distribuirSobraEmOutros([],[],0),[]));

test('Outros existente recebe somente a sobra recalculada', () => {
  const selecionadas = [
    { categoria_id: 2, categoria_nome: 'Roupas', limite: 500 },
    { categoria_id: 14, categoria_nome: 'Outros', limite: 900 },
  ];

  const catalogo = [
    { categoria_id: 2, categoria_nome: 'Roupas' },
    { categoria_id: 14, categoria_nome: 'Outros' },
  ];

  const resultado = distribuirSobraEmOutros(selecionadas, catalogo, 1500);

  assert.equal(resultado.find(c => c.categoria_id === 14).limite, 1500);
  assert.equal(resultado.find(c => c.categoria_id === 2).limite, 500);
  assert.equal(selecionadas[1].limite, 900);
});

test('Outros antigo é removido quando não existe sobra', () => {
  const selecionadas = [
    { categoria_id: 2, limite: 2000 },
    { categoria_id: 14, limite: 500 },
  ];

  const catalogo = [
    { categoria_id: 2, categoria_nome: 'Roupas' },
    { categoria_id: 14, categoria_nome: 'Outros' },
  ];

  const resultado = distribuirSobraEmOutros(selecionadas, catalogo, 0);

  assert.deepEqual(resultado, [{ categoria_id: 2, limite: 2000 }]);
});

test('sem categorias específicas todo orçamento pertence a Outros', () => {
  const catalogo = [
    { categoria_id: 14, categoria_nome: 'Outros' },
  ];

  const resultado = distribuirSobraEmOutros(
    [{ categoria_id: 14, limite: 300 }],
    catalogo,
    2000
  );

  assert.deepEqual(resultado, [
    { categoria_id: 14, categoria_nome: 'Outros', limite: 2000 },
  ]);
});
