// Função genérica para lidar com erros de requisições, é possível passar apenas handleApiError diretamente,
// que fará um log do erro, ou então especificar um texto para o log, uma função a ser executada em caso
// de erro 404, uma função os outros erros de servidor (4xx e 5xx) e outra para erros que não envolvem o
// servidor (como problemas de rede)
export function handleApiError(error, texto, function404, functionServer, functionNonServerError) {
  if (error.response) {
    const { status, data } = error.response;
    if (status === 404 && function404) {
      // Função a ser executada para lidar com erros 404
      function404();
      return;
    }
    if (functionServer) {
      functionServer();
      return;
    }
    texto ? console.error(texto, status, data) : console.error(status, data);
  } else {
    // Quando não há resposta do servidor, ou seja, erros de rede ou outros problemas
    texto ? console.error(texto, error) : console.error(error);
    if (functionNonServerError) {
      functionNonServerError();
    }
  }
}
