import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('CustomButton centraliza variantes, estados, ícones e acessibilidade', async () => {
  const component = await read('src/components/CustomButton/index.js');
  const styles = await read('src/components/CustomButton/styles.js');
  const colors = await read('src/constants/colors.js');

  for (const variant of ['PRIMARY', 'SECONDARY', 'OUTLINE', 'DANGER', 'GHOST']) assert.match(component, new RegExp(`${variant}:`));
  for (const token of ['buttonPrimaryBackground', 'buttonSecondaryBackground', 'buttonOutlineBorder', 'buttonDangerBackground', 'buttonGhostText', 'buttonDisabledBackground']) assert.match(colors, new RegExp(token));
  assert.match(component, /variant/);
  assert.match(component, /loading/);
  assert.match(component, /disabled/);
  assert.match(component, /iconOnly/);
  assert.match(component, /accessibilityState/);
  assert.match(component, /pressed/);
  assert.match(styles, /primaryButton/);
  assert.match(styles, /secondaryButton/);
  assert.match(styles, /outlineButton/);
  assert.match(styles, /dangerButton/);
  assert.match(styles, /ghostButton/);
  assert.match(styles, /disabledButton/);
});

test('MetaDetails preserva o resumo, remove duplicidades e agrupa o histórico', async () => {
  const screen = await read('src/pages/MetaDetailsScreen/index.js');
  const styles = await read('src/pages/MetaDetailsScreen/styles.js');
  assert.doesNotMatch(screen, /Última movimentação/);
  assert.doesNotMatch(screen, /Último depósito/);
  assert.doesNotMatch(screen, /Fim do histórico/);
  assert.match(screen, /Histórico de movimentações/);
  assert.match(screen, /Nenhuma movimentação registrada ainda/);
  assert.match(screen, /movementState\.nextCursor/);
  assert.match(screen, /Carregar mais/);
  assert.match(screen, /CustomButton/);
  assert.match(styles, /historySectionHeader/);
  assert.match(styles, /historyEmpty/);
  assert.doesNotMatch(styles, /latestBlock/);
});

test('MetaFormSheet utiliza as mesmas variantes globais sem alterar os inputs', async () => {
  const form = await read('src/components/Metas/MetaFormSheet/index.js');
  const styles = await read('src/components/Metas/MetaFormSheet/styles.js');
  assert.match(form, /variant="secondary"/);
  assert.match(form, /variant="primary"/);
  assert.match(form, /variant="danger"/);
  assert.match(form, /variant="ghost"/);
  assert.match(form, /normalizarValorMeta/);
  assert.match(form, /formatarValorMetaParaEntrada/);
  assert.match(styles, /COLORS\.button/);
});
