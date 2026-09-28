import { ToastAndroid } from 'react-native';

// Se true, exibe toast com mensagens de erro da API.
const toast = false;

// Registra somente metadados seguros. O objeto Axios completo pode conter o JWT
// nos headers da requisição e não deve ser escrito no console.
export function logApiErrors(error, texto, ativado = true) {
  const status = error?.response?.status;
  const codigo = error?.code;
  const mensagem = error?.response?.data?.message || error?.message || 'Erro desconhecido';

  if (ativado) {
    console.error(texto || 'Erro de API', { status, codigo, mensagem });
  }

  if (toast) {
    ToastAndroid.show(mensagem, ToastAndroid.LONG);
  }
}
