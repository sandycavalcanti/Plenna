import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Home mantém somente Nova compra como ação principal', async () => {
  const hero = await read('src/components/PurchaseHero/index.js');
  const styles = await read('src/components/PurchaseHero/styles.js');

  assert.match(hero, /navigation\.navigate\('CreateCompra'\)/);
  assert.match(hero, /Nova compra/);
  assert.doesNotMatch(hero, /Importar compra|handleImportarCompra|cloud-download-outline|Alert/);
  assert.doesNotMatch(styles, /secondaryButton|secondaryButtonText/);
  assert.match(styles, /primaryButton:[\s\S]*flex: 1/);
  assert.match(styles, /primaryButton:[\s\S]*width: '100%'/);
});
