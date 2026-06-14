// Função para imprimir detalhes do erro da API no console, se ativado for false, apenas erros de rede serão impressos.
export function logApiErrors(error, texto, ativado = true) {
  if (error.response) {
    const { status, data } = error.response;

    if (!ativado) {
      texto ? console.error(texto, status, data) : console.error(status, data);
    }
  } else {
    // Quando não há resposta do servidor, ou seja, erros de rede ou outros problemas
    texto ? console.error(texto, error) : console.error(error);
  }
}
