import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_STORAGE_KEY = '@plenna:authToken';

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
    if (sessionId === initialSessionId && !loaded) {
      memoryToken = storedToken;
      loaded = true;
    }
    return memoryToken;
  } catch {
    return memoryToken;
  }
}

async function writeTokenToStorage(token) {
  sessionId++;
  sessionController.abort();
  sessionController = new AbortController();
  memoryToken = token;
  loaded = true;

  pendingWrite = pendingWrite.then(async () => {
    try {
      if (token) {
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      return null;
    }
  });
  return pendingWrite;
}

export const tokenStorage = {
  key: TOKEN_STORAGE_KEY,
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
