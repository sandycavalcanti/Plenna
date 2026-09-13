import * as WebBrowser from 'expo-web-browser';
import { apiClient } from './client';

const RETORNO = 'plenna://oauth-success';
export const consultarConexaoEmail = async () => (await apiClient.get('/email/status')).data;
export const revogarEmail = () => apiClient.post('/consentimento', { consentimentoTipoCodigo: 'EMAIL', status: false });

// Dependências opcionais permitem testes isolados sem carregar módulos nativos.
export async function conectarEmail(client = apiClient, abrir = WebBrowser.openAuthSessionAsync) {
  let credenciais;
  try {
    const { data } = await client.post('/email/connect');
    credenciais = { tentativa: data.tentativa, state: data.state, segredo: data.segredo };
    const resultado = await abrir(data.url, RETORNO);
    if (resultado.type !== 'success') {
      await client.post('/email/cancel', credenciais);
      return { cancelado: true };
    }
    const url = new URL(resultado.url);
    if (url.protocol !== 'plenna:' || url.hostname !== 'oauth-success' ||
      url.searchParams.get('state') !== credenciais.state || url.searchParams.get('tentativa') !== credenciais.tentativa) {
      throw new Error('Retorno de conexão inválido');
    }
    if (url.searchParams.get('resultado') === 'cancelado') {
      await client.post('/email/cancel', credenciais);
      return { cancelado: true };
    }
    const code = url.searchParams.get('code');
    if (!code) throw new Error('Conexão não concluída');
    await client.post('/email/finalize', { ...credenciais, code });
    return { cancelado: false };
  } catch {
    // Nunca propaga Axios: sua config contém code/segredo e autenticação.
    throw new Error('Não foi possível confirmar a conexão. Atualize para verificar o estado.');
  } finally {
    credenciais = undefined;
  }
}
