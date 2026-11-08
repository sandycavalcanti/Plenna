import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_STORAGE_KEY = '@plenna:authToken';
const USAGE_BOUNDARY_KEY = '@plenna:rf017SessionBoundary';
const usageBoundaryEnabled = () => typeof process !== 'undefined' && process.env.EXPO_PUBLIC_USAGE_MONITORING_ENABLED === 'true';
let usageBoundary = null;

let memoryToken = null;
let loaded = false;
let sessionId = 0;
let sessionController = new AbortController();
let pendingWrite = Promise.resolve();

function invalidSession() {
  const error = new Error('Sessão invalidada');
  error.code = 'RF017_SESSION_INVALIDATED';
  return error;
}

async function readTokenFromStorage() {
  if (loaded) {
    return memoryToken;
  }

  const initialSessionId = sessionId;
  try {
    const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    const storedBoundary = usageBoundaryEnabled() ? await AsyncStorage.getItem(USAGE_BOUNDARY_KEY) : null;
    if (sessionId === initialSessionId && !loaded) {
      memoryToken = storedToken;
      usageBoundary = storedBoundary;
      loaded = true;
    }
    return memoryToken;
  } catch {
    return memoryToken;
  }
}

async function writeTokenToStorage(token) {
  const previousUsageToken = memoryToken;
  sessionId++;
  sessionController.abort();
  sessionController = new AbortController();
  // Marca o episódio local; não é credencial de autenticação nem identificador do aparelho.
  const boundaryForWrite = `${sessionId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  usageBoundary = boundaryForWrite;
  memoryToken = token;
  loaded = true;

  pendingWrite = pendingWrite.catch(() => undefined).then(async () => {
    try {
      // Registra o limite do episódio v2 sem iniciar coleta por conta própria.
      if (usageBoundaryEnabled()) {
        try {
          const usage = await import('../services/usageMonitoringService');
          await usage.stopUsageMonitoringForLogout(previousUsageToken);
        } catch { /* A indisponibilidade do monitoramento não impede salvar ou remover o token. */ }
      }
      if (usageBoundaryEnabled()) {
        // No Android, multiSet grava token e limite do episódio juntos.
        await AsyncStorage.multiSet([[TOKEN_STORAGE_KEY,token || ''],[USAGE_BOUNDARY_KEY,boundaryForWrite]]);
      } else if (token) {
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      const error = new Error('Não foi possível atualizar a sessão no armazenamento. Tente novamente.');
      error.code = 'AUTH_STORAGE_FAILURE';
      throw error;
    }
  });
  return pendingWrite;
}

export const tokenStorage = {
  key: TOKEN_STORAGE_KEY,
  getUsageBoundary: () => usageBoundary,
  getToken: readTokenFromStorage,
  setToken: writeTokenToStorage,
  clearToken: async () => writeTokenToStorage(null),
  captureSession: async () => {
    const id = sessionId;
    const token = await readTokenFromStorage();
    if (id !== sessionId) throw invalidSession();
    return token ? { id, signal: sessionController.signal } : null;
  },
  assertSession: (id) => {
    if (id !== sessionId || !memoryToken) throw invalidSession();
  },
};
