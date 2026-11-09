// Mensagens seguras para os fluxos de autenticação. Não repassa o corpo da API
// nem detalhes técnicos ao usuário.
export function getLoginErrorMessage(error) {
  const status = error?.response?.status;
  const codigo = error?.code;

  if (status === 401) {
    return 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
  }
  if (status === 400 || status === 422) {
    return 'Confira o formato dos dados informados e tente novamente.';
  }
  if (status === 429) {
    return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  }
  if (typeof status === 'number' && status >= 500) {
    return 'O serviço está temporariamente indisponível. Tente novamente em instantes.';
  }
  if (codigo === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
  }
  if (codigo === 'ECONNABORTED' || codigo === 'ETIMEDOUT') {
    return 'A conexão demorou mais que o esperado. Tente novamente.';
  }

  return 'Não foi possível entrar. Tente novamente.';
}

export function getRecoveryErrorMessage(error, operation = 'request') {
  const status = error?.response?.status;
  const codigo = error?.code;

  if (codigo === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
  }
  if (codigo === 'ECONNABORTED' || codigo === 'ETIMEDOUT') {
    return 'A conexão demorou mais que o esperado. Tente novamente.';
  }
  if (typeof status === 'number' && status >= 500) {
    return 'O serviço está temporariamente indisponível. Tente novamente em instantes.';
  }
  if (operation === 'verify' && (status === 400 || status === 401 || status === 404 || status === 422)) {
    return 'Código inválido ou expirado. Confira o código e tente novamente.';
  }
  if (operation === 'reset' && (status === 400 || status === 401 || status === 422)) {
    return 'Não foi possível redefinir a senha. Confira os dados e tente novamente.';
  }
  return 'Não foi possível concluir a recuperação. Tente novamente.';
}
