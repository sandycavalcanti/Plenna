import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_STORAGE_KEY = '@plenna:authToken';

let memoryToken = null;

async function readTokenFromStorage() {
  if (memoryToken) {
    return memoryToken;
  }

  try {
    const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    memoryToken = storedToken;
    return storedToken;
  } catch {
    return memoryToken;
  }
}

async function writeTokenToStorage(token) {
  memoryToken = token;

  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    return null;
  }
}

export const tokenStorage = {
  key: TOKEN_STORAGE_KEY,
  getToken: readTokenFromStorage,
  setToken: writeTokenToStorage,
  clearToken: async () => writeTokenToStorage(null),
};
