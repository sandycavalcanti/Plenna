import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Perfil, histórico e navegação de notificações expõem o fluxo proativo sem geração no render', async () => {
  const permissions = await readFile(new URL('../src/components/ProfileComponents/Permissions/index.js', import.meta.url), 'utf8');
  const history = await readFile(new URL('../src/pages/HistoricalChatScreen/index.js', import.meta.url), 'utf8');
  const navigation = await readFile(new URL('../src/services/notifications/notificationNavigation.js', import.meta.url), 'utf8');
  const constants = await readFile(new URL('../src/services/notifications/notificationConstants.js', import.meta.url), 'utf8');

  assert.match(permissions, /IA_PROATIVIDADE/);
  assert.match(permissions, /Conversas proativas/);
  assert.match(history, /historico_origem === 'PROATIVO'/);
  assert.match(navigation, /SUPPORTED_NOTIFICATION_TYPES/);
  assert.match(constants, /'PROATIVA'/);
  assert.doesNotMatch(permissions, /Requesty|generateForUser/);
});

