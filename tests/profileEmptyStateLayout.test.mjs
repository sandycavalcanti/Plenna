import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('estado vazio de metas separa o body do header e centraliza seu conteúdo', async () => {
  const component = await read('src/components/ProfileComponents/Metas/index.js');
  const styles = await read('src/components/ProfileComponents/Metas/styles.js');

  assert.match(component, /<ProfileCard[\s\S]*title="Minhas metas"[\s\S]*onEdit=/);
  assert.equal((component.match(/<View style=\{styles\.emptyBody\}>/g) || []).length, 2);
  assert.match(styles, /emptyBody:\s*\{[\s\S]*?flexGrow: 1[\s\S]*?width: '100%'[\s\S]*?alignItems: 'center'[\s\S]*?justifyContent: 'center'/);
  assert.match(styles, /emptyBody:\s*\{[\s\S]*?paddingHorizontal: 0/);
});
