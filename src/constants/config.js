import { Platform } from 'react-native';

// Variável para controlar exibir botões temporários para desenvolvimento, como o de pular login
// Defina como true para usar localhost
export const devMode = true;

const configuredApiUrl = typeof process !== 'undefined' && typeof process.env?.EXPO_PUBLIC_API_URL === 'string'
  ? process.env.EXPO_PUBLIC_API_URL.trim()
  : '';

export const urlAPI = configuredApiUrl || (devMode
  ? (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000')
  : 'https://plenna-api.vercel.app/');
