import assert from 'node:assert/strict';
import test from 'node:test';
import { createRenderer } from './helpers/componentRenderer.mjs';

const INVALID_CREDENTIALS = 'E-mail ou senha incorretos. Confira os dados e tente novamente.';

test('mensagens de autenticação não expõem detalhes técnicos', () => {
  const messages = createRenderer().load('src/utils/authMessages.js');

  assert.equal(messages.getLoginErrorMessage({ response: { status: 401 } }), INVALID_CREDENTIALS);
  assert.equal(
    messages.getLoginErrorMessage({ code: 'ERR_NETWORK', message: 'Network Error' }),
    'Não foi possível conectar. Verifique sua internet e tente novamente.',
  );
  assert.equal(
    messages.getLoginErrorMessage({ response: { status: 500 }, message: 'stack trace interno' }),
    'O serviço está temporariamente indisponível. Tente novamente em instantes.',
  );
  assert.equal(
    messages.getRecoveryErrorMessage({ response: { status: 401 } }, 'verify'),
    'Código inválido ou expirado. Confira o código e tente novamente.',
  );
});

test('AppFeedback renderiza erro acessível e permite fechamento', () => {
  const renderer = createRenderer();
  const Feedback = renderer.load('src/components/Common/AppFeedback/index.js').default;
  let dismissed = 0;

  renderer.mount(Feedback, {
    message: INVALID_CREDENTIALS,
    type: 'error',
    onDismiss: () => { dismissed += 1; },
    testID: 'feedback',
  });

  const feedback = renderer.nodes((node) => node.props.testID === 'feedback')[0];
  assert.equal(feedback.props.accessibilityRole, 'alert');
  assert.equal(feedback.props.accessibilityLiveRegion, 'polite');
  assert.equal(feedback.props.accessibilityLabel, INVALID_CREDENTIALS);

  const close = renderer.nodes((node) => node.props.accessibilityLabel === 'Fechar mensagem')[0];
  close.props.onPress();
  assert.equal(dismissed, 1);
});

test('Login mostra erro de credenciais sem usar Alert e mantém nova tentativa disponível', async () => {
  const calls = [];
  const renderer = createRenderer({
    '../../api/client': {
      apiClient: {
        post: async (...args) => {
          calls.push(args);
          throw { response: { status: 401 }, code: 'ERR_BAD_REQUEST' };
        },
      },
    },
    '../../api/tokenStorage': { tokenStorage: { async setToken() {} } },
    '../../utils/error': { logApiErrors() {} },
    '../../utils/authMessages': { getLoginErrorMessage: () => INVALID_CREDENTIALS },
    '../../services/security/protectedSession': { invalidateProtectedSession() {} },
  });
  const Login = renderer.load('src/pages/LoginScreen/index.js').default;
  renderer.mount(Login, { navigation: { replace() {}, navigate() {} } });

  const inputs = renderer.nodes((node) => node.type === 'CustomTextInput');
  assert.equal(inputs.length, 2);
  inputs[0].props.textValue.current = 'user@example.com';
  inputs[1].props.textValue.current = 'senha-incorreta';

  const enter = renderer.nodes((node) => node.type === 'Button' && node.props.title === 'Entrar')[0];
  await enter.props.onPress();
  await renderer.flush();

  const feedback = renderer.nodes((node) => node.props.testID === 'login-feedback')[0];
  assert.ok(feedback);
  assert.equal(feedback.props.accessibilityLabel, INVALID_CREDENTIALS);
  assert.equal(calls.length, 1);

  const retryButton = renderer.nodes((node) => node.type === 'Button' && node.props.title === 'Entrar')[0];
  assert.equal(retryButton.props.disabled, false);
  assert.equal(retryButton.props.loading, false);
  assert.deepEqual(renderer.alerts, []);
});

test('Login trata validações locais com feedback e não chama a API', async () => {
  let calls = 0;
  const renderer = createRenderer({
    '../../api/client': { apiClient: { post: async () => { calls += 1; } } },
    '../../utils/error': { logApiErrors() {} },
    '../../utils/authMessages': { getLoginErrorMessage: () => INVALID_CREDENTIALS },
  });
  const Login = renderer.load('src/pages/LoginScreen/index.js').default;
  renderer.mount(Login, { navigation: { replace() {}, navigate() {} } });

  const enter = renderer.nodes((node) => node.type === 'Button' && node.props.title === 'Entrar')[0];
  await enter.props.onPress();
  await renderer.flush();

  const feedback = renderer.nodes((node) => node.props.testID === 'login-feedback')[0];
  assert.equal(feedback.props.accessibilityLabel, 'Preencha o e-mail e a senha.');
  assert.equal(calls, 0);
});

test('recuperação mostra falha de rede no feedback compartilhado', async () => {
  const renderer = createRenderer({
    '../../api/client': {
      apiClient: {
        post: async () => { throw { code: 'ERR_NETWORK', message: 'Network Error' }; },
      },
    },
    '../../utils/error': { logApiErrors() {} },
    '../../utils/authMessages': {
      getRecoveryErrorMessage: () => 'Não foi possível conectar. Verifique sua internet e tente novamente.',
    },
  });
  const Recovery = renderer.load('src/pages/ForgotPasswordScreen/index.js').default;
  renderer.mount(Recovery, { navigation: { navigate() {} } });

  const input = renderer.nodes((node) => node.type === 'CustomTextInput')[0];
  input.props.textValue.current = 'user@example.com';
  const send = renderer.nodes((node) => node.type === 'Button' && node.props.title === 'Enviar código')[0];
  await send.props.onPress();
  await renderer.flush();

  const feedback = renderer.nodes((node) => node.props.testID === 'recovery-feedback')[0];
  assert.equal(feedback.props.accessibilityLabel, 'Não foi possível conectar. Verifique sua internet e tente novamente.');
  assert.deepEqual(renderer.alerts, []);
});
