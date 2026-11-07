import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('ProfileCard centraliza ações de edição acessíveis sem forçar decoração nos títulos', async () => {
  const card = await read('src/components/ProfileComponents/ProfileCard/index.js');
  const styles = await read('src/components/ProfileComponents/ProfileCard/styles.js');

  assert.match(card, /actionIcon = null/);
  assert.match(card, /actionAccessibilityLabel/);
  assert.match(card, /variant="ghost"/);
  assert.match(card, /profileIconAction/);
  assert.match(styles, /profileIconAction/);
});

test('dados pessoais e preferências usam lápis MaterialCommunityIcons compartilhado', async () => {
  const personal = await read('src/components/ProfileComponents/PersonalInfo/index.js');
  const preferences = await read('src/components/BudgetPreferences/index.js');

  for (const source of [personal, preferences]) {
    assert.match(source, /actionIcon="pencil-outline"/);
    assert.match(source, /actionAccessibilityLabel=/);
    assert.doesNotMatch(source, /actionLabel="Editar"/);
  }
  assert.doesNotMatch(personal, /rowIcon|Feather/);
  assert.doesNotMatch(preferences, /summaryIcon|MaterialCommunityIcons/);
});

test('perfil usa acentos suaves da paleta existente sem criar cores locais', async () => {
  const header = await read('src/components/ProfileComponents/ProfileHeader/styles.js');
  const finance = await read('src/components/BudgetPreferences/styles.js');
  const permissions = await read('src/components/ProfileComponents/Permissions/styles.js');
  const security = await read('src/pages/ProfileScreen/styles.js');

  assert.doesNotMatch(header, /borderLeftWidth|borderLeftColor/);
  assert.match(header, /COLORS\.buttonOutlineBorder/);
  assert.match(finance, /COLORS\.surfaceMuted/);
  assert.match(permissions, /borderTopColor: COLORS\.border/);
  assert.doesNotMatch(permissions, /backgroundColor: COLORS\.surfaceMuted/);
  assert.match(security, /securityIcon/);
  for (const source of [header, finance, permissions, security]) {
    assert.doesNotMatch(source, /#[0-9A-Fa-f]{3,8}/);
  }
});

test('seções mantêm navegação, metas e segurança com detalhes visuais discretos', async () => {
  const metas = await read('src/components/ProfileComponents/Metas/index.js');
  const permissions = await read('src/components/ProfileComponents/Permissions/index.js');
  const screen = await read('src/pages/ProfileScreen/index.js');

  assert.doesNotMatch(metas, /<ProfileCard[^>]*\bicon=/);
  assert.match(metas, /actionIcon="view-list-outline"/);
  assert.match(metas, /actionAccessibilityLabel="Gerenciar metas"/);
  assert.doesNotMatch(metas, /actionLabel="Gerenciar"/);
  assert.match(metas, /MetaDetails/);
  assert.match(permissions, /navigate\('MemoryList'\)/);
  assert.match(screen, /Feather name="shield"/);
  assert.match(screen, /handleChangePin/);
  assert.match(screen, /accessibilityLabel="Alterar PIN de compras"/);
});

test('identidade do Perfil usa inicial Ãºnica centralizada e preserva aÃ§Ãµes da conta', async () => {
  const header = await read('src/components/ProfileComponents/ProfileHeader/index.js');
  const styles = await read('src/components/ProfileComponents/ProfileHeader/styles.js');
  const screen = await read('src/pages/ProfileScreen/index.js');

  assert.match(header, /return words\[0\]\[0\]\.toUpperCase\(\)/);
  assert.match(styles, /identityRow:[\s\S]*?alignItems: 'center'/);
  assert.match(styles, /identityCopy:[\s\S]*?alignItems: 'center'/);
  assert.match(styles, /action:[\s\S]*?position: 'absolute'/);
  assert.match(screen, /icon="dots-vertical"/);
  assert.doesNotMatch(header, /userIcon|<Image|editAvatarButton/);
});
