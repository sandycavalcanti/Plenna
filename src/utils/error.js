import { ToastAndroid } from "react-native";

// Se true, vai fazer toast de qualquer mensagem de erro da API
const toast = false;

// Função para imprimir detalhes do erro da API no console, se ativado for false, apenas erros de rede serão impressos.
export function logApiErrors(error, texto, ativado = true) {
  if (error.response) {
    const { status, data } = error.response;

    if (ativado) {
      texto ? console.error(texto, status, data) : console.error(status, data);
    }
    if (toast) {
      const mensagemErro = error.response?.data?.message || 'Houve um erro';
      ToastAndroid.show(mensagemErro, ToastAndroid.LONG);
    }
  } else {
    // Quando não há resposta do servidor, ou seja, erros de rede ou outros problemas
    texto ? console.error(texto, error) : console.error(error);
    if(toast) {
      ToastAndroid.show('Erro de rede ou servidor indisponível', ToastAndroid.LONG);
    }
  }
}
