import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('card introdutório de metas preserva texto legível e botão com largura intrínseca', async () => {
  const styles = await read('src/pages/EditProfileScreen/styles.js');

  assert.match(styles, /metasIntroCard:[\s\S]*?alignItems: 'stretch'/);
  assert.match(styles, /metasIntroTopRow:[\s\S]*?flexDirection: 'row'/);
  assert.match(styles, /metasIntroCopy:[\s\S]*?minWidth: 0/);
  assert.match(styles, /addMetaAction:[\s\S]*?width: 'auto'/);
  assert.match(styles, /addMetaAction:[\s\S]*?flexGrow: 0/);
  assert.match(styles, /addMetaAction:[\s\S]*?flexShrink: 0/);
  assert.match(styles, /addMetaAction:[\s\S]*?alignSelf: 'flex-end'/);
});

test('botão de memórias usa a largura útil da seção sem alterar sua navegação', async () => {
  const screen = await read('src/components/ProfileComponents/Permissions/index.js');
  const styles = await read('src/components/ProfileComponents/Permissions/styles.js');

  assert.match(screen, /title="Consultar minhas memórias"/);
  assert.match(screen, /navigation\.navigate\('MemoryList'\)/);
  assert.match(styles, /memoryButton:[\s\S]*?alignSelf: 'stretch'/);
  assert.match(styles, /memoryButton:[\s\S]*?width: '100%'/);
});

test('cards de dashboard usam borda semântica e reservam sombra para superfícies elevadas', async () => {
  const colors = await read('src/constants/colors.js');
  const theme = await read('src/constants/dashboardTheme.js');
  const dashboard = await read('src/pages/DashboardScreen/styles.js');
  const profileCard = await read('src/components/ProfileComponents/ProfileCard/styles.js');
  const monthlySummary = await read('src/components/DashboardComponents/GastosGerais/styles.js');

  assert.match(colors, /surface:/);
  assert.match(colors, /border:/);
  assert.match(theme, /borders:[\s\S]*?card:[\s\S]*?borderWidth: 1/);
  assert.match(theme, /borders:[\s\S]*?borderColor: COLORS\.border/);
  assert.ok((dashboard.match(/\.\.\.B\.card/g) || []).length >= 8);
  assert.match(dashboard, /monthModal:[\s\S]*?\.\.\.SH\.card/);
  assert.match(profileCard, /dashboardContainer:[\s\S]*?\.\.\.DASHBOARD_BORDERS\.card/);
  assert.match(monthlySummary, /\.\.\.DASHBOARD_BORDERS\.card/);
  assert.doesNotMatch(monthlySummary, /shadowColor|shadowOpacity|shadowRadius|elevation/);
});

test('MetaFormSheet recupera a paleta suave sem criar estilos de botão isolados', async () => {
  const form = await read('src/components/Metas/MetaFormSheet/index.js');
  const styles = await read('src/components/Metas/MetaFormSheet/styles.js');
  const buttonStyles = await read('src/components/CustomButton/styles.js');

  assert.match(form, /variant="primary"/);
  assert.match(form, /variant="secondary"/);
  assert.match(form, /variant="danger"/);
  assert.match(form, /variant="ghost"/);
  assert.match(styles, /backgroundColor: COLORS\.surface/);
  assert.match(styles, /borderColor: COLORS\.border/);
  assert.match(styles, /inputFocused:[\s\S]*?COLORS\.cadTextoAdicionarLimites/);
  assert.match(buttonStyles, /primaryButton:[\s\S]*?COLORS\.buttonPrimaryBackground/);
  assert.doesNotMatch(styles, /#FAF7FC|#D9CEE8|#893467/);
});
