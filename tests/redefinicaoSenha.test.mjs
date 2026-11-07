import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRenderer } from './helpers/componentRenderer.mjs';

function setup(params, post = async () => ({})) {
  const calls = [], navigation = { reset: value => calls.push(value) };
  const r = createRenderer({ '../../api/client': { apiClient: { post: async (...args) => { calls.push(args); return post(...args); } } } });
  r.mount(r.load('src/pages/ForgotPasswordScreen/index.js').default, { route: params ? { params } : {}, navigation });
  const input = name => r.nodes(n => n.type === 'CustomTextInput' && n.props.placeholder === name)[0].props.textValue;
  const press = title => r.nodes(n => n.type === 'Button' && n.props.title === title)[0].props.onPress();
  return { r, calls, input, press };
}
test('email inválido não faz chamada; erro de rede permite tentar novamente', async () => {
  const { r, calls, input, press } = setup(null, async () => { throw new Error('offline'); });
  input('Email').current = 'invalido'; await press('Enviar código'); assert.equal(calls.length, 0);
  input('Email').current = ' TESTE@example.invalid '; await press('Enviar código'); await r.flush();
  assert.equal(calls[0][1].email, 'teste@example.invalid');
  assert.equal(r.alerts.at(-1)[0], 'Erro');
  await press('Enviar código'); assert.equal(calls.length, 2); r.unmount();
});
test('toque duplicado faz uma chamada e resposta genérica mostra passo do código', async () => {
  let done; const { r, calls, input, press } = setup(null, () => new Promise(resolve => { done = resolve; }));
  input('Email').current = 'teste@example.invalid'; const first = press('Enviar código'); await press('Enviar código');
  assert.equal(calls.length, 1); done({}); await first; await r.flush();
  assert.ok(input('Código')); assert.match(r.alerts.at(-1)[1], /Se houver uma conta/); r.unmount();
});
test('link abre nova senha; divergência e senha fraca não chamam API; sucesso retorna ao login', async () => {
  const token = 'a'.repeat(64);
  const { r, calls, input, press } = setup({ email: 'teste@example.invalid', token }); await r.flush();
  input('Nova senha').current = 'abc'; await press('Alterar senha'); assert.equal(calls.length, 0);
  input('Nova senha').current = 'NovaSenha1'; input('Confirmar senha').current = 'Outra1'; await press('Alterar senha'); assert.equal(calls.length, 0);
  input('Confirmar senha').current = 'NovaSenha1'; await press('Alterar senha');
  assert.deepEqual(calls[0], ['/auth/reset-password', { email: 'teste@example.invalid', codigo: token, novaSenha: 'NovaSenha1' }]);
  assert.deepEqual(calls[1], { index: 0, routes: [{ name: 'Login' }] }); r.unmount();
});
test('link expirado permite solicitar nova recuperação; link malformado não abre senha', async () => {
  const { r, input, press } = setup({ email: 'teste@example.invalid', token: 'a'.repeat(64) }, async () => { throw { response: { status: 400, data: { message: 'Código inválido ou expirado' } } }; });
  await r.flush(); input('Nova senha').current = input('Confirmar senha').current = 'NovaSenha1';
  await press('Alterar senha'); await r.flush(); assert.ok(input('Email')); r.unmount();
  const bad = setup({ email: 'teste@example.invalid', token: 'bad' }); await bad.r.flush(); assert.ok(bad.input('Email')); bad.r.unmount();
});
test('rota de link e esquema Android existentes recebem recuperação', () => {
  assert.match(readFileSync('src/routes.js', 'utf8'), /ForgotPassword: 'reset-password'/);
  assert.equal(JSON.parse(readFileSync('app.json', 'utf8')).expo.scheme, 'plenna');
});
