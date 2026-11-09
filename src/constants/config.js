import { Platform } from 'react-native';

// O tipo de build controla o fallback; gerar um APK não reescreve este arquivo.
export const devMode = typeof __DEV__ !== 'undefined' && __DEV__;

const configuredApiUrl = typeof process !== 'undefined' && typeof process.env?.EXPO_PUBLIC_API_URL === 'string'
  ? process.env.EXPO_PUBLIC_API_URL.trim()
  : '';
const fallbackApiUrl = 'https://plenna-api.vercel.app/';
// const fallbackApiUrl = devMode
//   ? (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000')
//   : 'https://plenna-api.vercel.app/';

export const urlAPI = configuredApiUrl || fallbackApiUrl;
