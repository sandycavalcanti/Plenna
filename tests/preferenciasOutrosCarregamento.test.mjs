import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('recupera o nome Outros pelo catálogo quando a API não envia o nome', () => {
  const codigo = readFileSync(
    'src/pages/EditPreferencesScreen/index.js',
    'utf8'
  );

  const expressao = codigo.match(
    /categoria_nome:\s*(respCategorias\.data\.find\([^\n]+)/
  );

  assert.ok(expressao, 'Consulta ao catálogo não encontrada');

  const obterNome = new Function(
    'respCategorias',
    'pref',
    `return ${expressao[1].replace(/,\s*$/, '')};`
  );

  const respCategorias = {
    data: [
      { categoria_id: 14, categoria_nome: 'Outros' },
      { categoria_id: 2, categoria_nome: 'Roupas' }
    ]
  };

  const pref = {
    categoria_id: 14,
    preferencia_meta: 150
  };

  assert.equal(obterNome(respCategorias, pref), 'Outros');
});
