import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformSync } from '@babel/core';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Perfil usa cabeçalho compacto com dados reais e não oferece upload fictício', async () => {
  const source = await read('src/components/ProfileComponents/ProfileHeader/index.js');
  assert.match(source, /export default function ProfileHeader\(\{ nome, email, rightAction \}\)/);
  assert.match(source, /displayName/);
  assert.doesNotMatch(source, /displayEmail|styles\.email|styles\.muted/);
  assert.match(source, /getInitials/);
  assert.doesNotMatch(source, /<Image|require\([^)]*userIcon|editAvatarButton|onPress=\{\(\) => \{\}\}/);
});

test('Perfil mantém as seções funcionais e separa a segurança visualmente', async () => {
  const source = await read('src/pages/ProfileScreen/index.js');
  assert.match(source, /<ProfileHeader[\s\S]*email=\{email\.current\}/);
  assert.match(source, /<PersonalInfo/);
  assert.match(source, /<Metas metas=\{metas\}/);
  assert.match(source, /<BudgetPreferences/);
  assert.match(source, /<Permissions \/>/);
  assert.match(source, /Segurança das compras/);
  assert.match(source, /handleChangePin/);
  assert.match(source, /handleLogout/);
  assert.match(source, /handleDeleteAccount/);
});

test('seções do Perfil usam ProfileCard moderno sem o título sobre a borda', async () => {
  const paths = [
    'src/components/ProfileComponents/PersonalInfo/index.js',
    'src/components/ProfileComponents/Metas/index.js',
    'src/components/BudgetPreferences/index.js',
    'src/components/ProfileComponents/Permissions/index.js',
  ];
  for (const path of paths) {
    const source = await read(path);
    assert.match(source, /variant="profile"/, path);
  }
  const styles = await read('src/components/ProfileComponents/ProfileCard/styles.js');
  assert.match(styles, /profileContainer/);
  assert.match(styles, /borderColor: COLORS\.border/);
  assert.match(styles, /profileTitleWrapper[\s\S]*backgroundColor: 'transparent'/);
});

test('metas do Perfil reutilizam o card resumido da Home e preservam ações', async () => {
  const profile = await read('src/components/ProfileComponents/Metas/index.js');
  const shared = await read('src/components/Metas/MetaSummaryCard/index.js');
  assert.match(profile, /MetaSummaryCard/);
  assert.match(profile, /onToggleComplete/);
  assert.match(profile, /MetaDetails/);
  assert.match(profile, /mode: 'metas'/);
  assert.match(shared, /formatarValorMeta/);
  assert.match(shared, /formatarPercentualMeta/);
  assert.match(shared, /MetaProgressBar/);
  assert.match(shared, /meta_valor/);
  assert.match(shared, /progresso_percentual/);
  assert.doesNotMatch(shared, /\/\s*100/);
});

test('preferências financeiras são resumo de leitura e não inventam zero', async () => {
  const source = await read('src/components/BudgetPreferences/index.js');
  assert.match(source, /Preferências financeiras/);
  assert.match(source, /formatarValorOuIndisponivel/);
  assert.match(source, /não informado/i);
  assert.match(source, /Limites por categoria/);
  assert.doesNotMatch(source, /R\$ 0,00/);
});

test('permissões, memória e consulta de memórias continuam no componente real', async () => {
  const source = await read('src/components/ProfileComponents/Permissions/index.js');
  assert.match(source, /Permissões e integrações/);
  assert.match(source, /Memória da IA/);
  assert.match(source, /Consultar minhas memórias/);
  assert.match(source, /navigate\('MemoryList'\)/);
  assert.match(source, /handleToggleMemory/);
  assert.match(source, /handleTogglePersonalizacao/);
  assert.match(source, /handleToggleProatividade/);
});

test('arquivos principais da refatoração continuam sintaticamente válidos', async () => {
  const paths = [
    'src/pages/ProfileScreen/index.js',
    'src/components/ProfileComponents/ProfileHeader/index.js',
    'src/components/ProfileComponents/Metas/index.js',
    'src/components/Metas/MetaSummaryCard/index.js',
    'src/components/BudgetPreferences/index.js',
  ];
  for (const path of paths) {
    const source = await read(path);
    assert.doesNotThrow(() => transformSync(source, {
      filename: path,
      configFile: false,
      babelrc: false,
      plugins: ['@babel/plugin-transform-react-jsx'],
    }), path);
  }
});
