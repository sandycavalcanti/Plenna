import { Platform } from 'react-native';

// Variável para controlar exibir botões temporários para desenvolvimento, como o de pular login
export const devMode = false; // Defina como true para usar localhost durante o desenvolvimento, false para produção

export const urlAPI = devMode ? (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000') : 'https://plenna-api-orpin.vercel.app/';