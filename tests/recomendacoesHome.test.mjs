import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Home consome recomendações persistidas sem gerar IA no carregamento', async () => {
  const [home, api, hook] = await Promise.all([
    read('src/pages/HomeScreen/index.js'),
    read('src/api/recomendacoes.js'),
    read('src/hooks/useRecomendacoesHome.js'),
  ]);
  assert.match(api, /GET|listarRecomendacoes|\/recomendacoes/);
  assert.match(api, /\/recomendacoes/);
  assert.match(hook, /useFocusEffect/);
  assert.match(home, /useRecomendacoesHome/);
  assert.match(home, /Conversar sobre isso/);
  assert.match(home, /DESCARTADA/);
  assert.doesNotMatch(home, /Requesty|chatWithTools|generateRecommendation/);
});

test('integração distingue contrato inválido, personalização desativada e erro de rede', async () => {
  const [config, hook, home] = await Promise.all([
    read('src/constants/config.js'),
    read('src/hooks/useRecomendacoesHome.js'),
    read('src/pages/HomeScreen/index.js'),
  ]);
  assert.match(config, /EXPO_PUBLIC_API_URL/);
  assert.match(hook, /RECOMENDACOES_CONTRACT_INVALID/);
  assert.match(hook, /status === 403/);
  assert.match(home, /consentimentoAtivo === false/);
  assert.match(home, /Ative as recomenda/);
});

test('ação Conversar abre nova conversa com contexto limitado e seguro', async () => {
  const home = await read('src/pages/HomeScreen/index.js');
  const chat = await read('src/pages/ChatScreen/index.js');
  assert.match(home, /mode: 'new'/);
  assert.match(home, /slice\(0, 800\)/);
  assert.match(chat, /recommendationContext/);
  assert.match(chat, /CHAT_MAX_MESSAGE_CHARS/);
});
