import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/pages/SignUpScreen/index.js', import.meta.url), 'utf8');
const registration = source.slice(source.indexOf('async function CadastrarUsuario'), source.indexOf('  function listarCategorias'));
const oauth = source.slice(source.indexOf('  async function vincularEmailGoogle'), source.indexOf('  return (\n  <SafeAreaView'));

function setup(options = {}) {
  const calls = [];
  const result = { calls, step: 1 };
  const env = {
    signupInFlight: { current: false }, signupCreated: { current: null },
    emailOptIn: { current: options.wantsGmail ?? false }, checkboxTermos: options.terms ?? true,
    checkboxMonitoramento: false, stepOneInvalido: false, nome: 'Conta', senha: 'Senha123',
    email: 'CONTA@example.test', setSignupLoading() {}, setStepOneAttempted() {},
    setSignupFeedback(feedback) { result.feedback = feedback; }, setStep(step) { result.step = step; },
    registrarFalhaPreferencias() {}, invalidateProtectedSession() {}, navigation: { replace() {} },
    tokenStorage: { async setToken() {}, async captureSession() { return { id: 1 }; }, assertSession() {} },
    Alert: { alert() {} }, URL,
    WebBrowser: { async openAuthSessionAsync() { return options.browserResult ?? { type: 'cancel' }; } },
    apiClient: {
      async get(path) {
        calls.push(path);
        return { data: { tentativa: 'current', url: 'https://example.test', state: 'state', segredo: 'secret' } };
      },
      async post(path) {
        calls.push(path);
        if (path === '/auth/login' && options.failFirstLogin && calls.filter(value => value === path).length === 1) {
          throw new Error('indisponível');
        }
        return { data: { token: 'fixture', onboardingCompleto: false } };
      },
    },
  };
  const submit = new Function(...Object.keys(env), registration + oauth + '\nreturn CadastrarUsuario;')(...Object.values(env));
  return { ...result, env, result, submit };
}

test('termos obrigatórios impedem requisição e exibem mensagem', async () => {
  const { submit, calls, result } = setup({ terms: false });
  await submit();
  assert.deepEqual(calls, []);
  assert.match(result.feedback.message, /termos/);
});

test('retoma conta criada após falha no login e bloqueia o toque duplicado', async () => {
  const { submit, calls, result } = setup({ failFirstLogin: true });
  await Promise.all([submit(), submit()]);
  assert.equal(result.feedback.type, 'error');
  await submit();
  assert.deepEqual(calls, ['/auth/register', '/auth/login', '/auth/login']);
  assert.equal(result.step, 2);
});

test('cancelamento do navegador encerra a tentativa e avança', async () => {
  const { submit, calls, result } = setup({ wantsGmail: true });
  await submit();
  assert.deepEqual(calls, ['/auth/register', '/auth/login', '/email/connect', '/email/connect/cancel']);
  assert.equal(result.step, 2);
});

test('callback de outra tentativa é ignorado e a tentativa atual é encerrada', async () => {
  const { submit, calls, result } = setup({
    wantsGmail: true, browserResult: { type: 'success', url: 'plenna://oauth-success?tentativa=other' },
  });
  await submit();
  assert.equal(calls.at(-1), '/email/connect/cancel');
  assert.equal(result.step, 2);
});