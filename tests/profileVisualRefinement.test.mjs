import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('ProfileCard centraliza icones de seção e ações de edição acessíveis', async () => {
  const card = await read('src/components/ProfileComponents/ProfileCard/index.js');
  const styles = await read('src/components/ProfileComponents/ProfileCard/styles.js');

  assert.match(card, /icon = null/);
  assert.match(card, /actionIcon = null/);
  assert.match(card, /actionAccessibilityLabel/);
  assert.match(card, /variant="ghost"/);
  assert.match(card, /profileIconAction/);
  assert.match(styles, /sectionIcon/);
  assert.match(styles, /profileIconAction/);
});

test('dados pessoais e preferências usam lápis compartilhado, sem ação textual redundante', async () => {
  const personal = await read('src/components/ProfileComponents/PersonalInfo/index.js');
  const preferences = await read('src/components/BudgetPreferences/index.js');

  for (const source of [personal, preferences]) {
    assert.match(source, /actionIcon="edit-2"/);
    assert.match(source, /actionAccessibilityLabel=/);
    assert.doesNotMatch(source, /actionLabel="Editar"/);
  }
  assert.match(personal, /rowIcon/);
  assert.match(preferences, /summaryIcon/);
});

test('perfil usa acentos suaves da paleta existente sem criar cores locais', async () => {
  const header = await read('src/components/ProfileComponents/ProfileHeader/styles.js');
  const finance = await read('src/components/BudgetPreferences/styles.js');
  const permissions = await read('src/components/ProfileComponents/Permissions/styles.js');
  const security = await read('src/pages/ProfileScreen/styles.js');

  assert.match(header, /borderLeftColor: COLORS\.dadoDois/);
  assert.match(header, /COLORS\.buttonOutlineBorder/);
  assert.match(finance, /COLORS\.buttonSecondaryBackground/);
  assert.match(finance, /COLORS\.buttonPositiveBackground/);
  assert.match(permissions, /backgroundColor: COLORS\.surfaceMuted/);
  assert.match(security, /securityIcon/);
  for (const source of [header, finance, permissions, security]) {
    assert.doesNotMatch(source, /#[0-9A-Fa-f]{3,8}/);
  }
});

test('seções mantêm navegação, metas e segurança com detalhes visuais discretos', async () => {
  const metas = await read('src/components/ProfileComponents/Metas/index.js');
  const permissions = await read('src/components/ProfileComponents/Permissions/index.js');
  const screen = await read('src/pages/ProfileScreen/index.js');

  assert.match(metas, /icon="target"/);
  assert.match(metas, /actionLabel="Gerenciar"/);
  assert.match(metas, /MetaDetails/);
  assert.match(permissions, /icon="sliders"/);
  assert.match(permissions, /navigate\('MemoryList'\)/);
  assert.match(screen, /Feather name="shield"/);
  assert.match(screen, /handleChangePin/);
  assert.match(screen, /accessibilityLabel="Alterar PIN de compras"/);
});
