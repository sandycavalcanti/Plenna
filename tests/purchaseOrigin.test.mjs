import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const purchaseItemSource = fs.readFileSync(
  new URL('../src/components/PurchaseComponents/PurchaseItem/index.js', import.meta.url),
  'utf8',
);

test('badge de origem por e-mail depende exclusivamente de compra_email true', () => {
  assert.match(purchaseItemSource, /purchase\.compra_email === true/);
  assert.match(purchaseItemSource, /name="email-outline"/);
  assert.match(purchaseItemSource, />Via e-mail<\/Text>/);
  assert.doesNotMatch(purchaseItemSource, /purchase\.compra_fonte\s*===?\s*['"]e-?mail/i);
});

test('badge não usa truthiness para campos ausentes ou nulos', () => {
  assert.doesNotMatch(purchaseItemSource, /if\s*\(purchase\.compra_email\)/);
  assert.doesNotMatch(purchaseItemSource, /Boolean\(purchase\.compra_email\)/);
});
