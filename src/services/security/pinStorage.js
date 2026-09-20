import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// Todas as chaves do fluxo ProtectedAccess ficam centralizadas aqui. O
// SecureStore aceita somente caracteres alfanuméricos, ponto, hífen e
// sublinhado; por isso o namespace não usa o formato de chave do AsyncStorage
// que contém `@` e `:`.
export const SECURE_STORE_KEY_NAMESPACE = 'plenna.purchase-pin';
const PIN_LENGTH = 6;
const RECORD_VERSION = 1;

function normalizeUserId(userId) {
  const normalizedUserId = String(userId ?? '').trim();

  // O backend identifica o usuário por usuario_id inteiro. Validar o formato
  // em vez de remover caracteres evita colisões: dois valores diferentes não
  // podem virar a mesma chave depois de uma sanitização destrutiva.
  if (!/^[1-9]\d*$/.test(normalizedUserId)) {
    throw new Error('Usuário inválido para armazenamento do PIN.');
  }

  return normalizedUserId;
}

function assertPin(pin) {
  if (!/^\d{6}$/.test(String(pin))) {
    throw new Error(`O PIN deve possuir exatamente ${PIN_LENGTH} dígitos.`);
  }
}

export function getPinStorageKey(userId) {
  // O usuario_id faz parte da chave para que o SecureStore de A nunca seja
  // consultado quando B estiver autenticado no mesmo aparelho.
  return `${SECURE_STORE_KEY_NAMESPACE}.${normalizeUserId(userId)}`;
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function createSalt() {
  // Salt aleatório impede que dois usuários com o mesmo PIN produzam o mesmo
  // verificador. O salt não é secreto; o PIN nunca sai desta função.
  return bytesToHex(await Crypto.getRandomBytes(32));
}

async function createVerifier(userId, pin, salt) {
  assertPin(pin);

  // O verificador inclui o usuário, impedindo reutilização acidental de um
  // registro em outro namespace. Apenas o digest é persistido.
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA512,
    `${salt}:${normalizeUserId(userId)}:${pin}`,
  );
}

async function readRecord(userId) {
  let serialized;
  const key = getPinStorageKey(userId);
  try {
    serialized = await SecureStore.getItemAsync(key);
  } catch (error) {
    // O erro é relançado para o hook distinguir SecureStore de ausência normal
    // de PIN. Nenhum valor armazenado é incluído no diagnóstico.
    throw error;
  }

  if (!serialized) return null;

  try {
    const record = JSON.parse(serialized);
    if (!record?.salt || !record?.verifier || record.version !== RECORD_VERSION) return null;
    return record;
  } catch (error) {
    return null;
  }
}

export async function getPinRecord(userId) {
  return readRecord(userId);
}

export async function savePin(userId, pin) {
  assertPin(pin);
  const normalizedUserId = normalizeUserId(userId);
  const salt = await createSalt();
  const verifier = await createVerifier(normalizedUserId, pin, salt);
  const key = getPinStorageKey(normalizedUserId);

  // SecureStore usa armazenamento protegido do sistema. O objeto salvo não
  // contém PIN puro, e o PIN não é enviado para a API nem escrito em logs.
  try {
    await SecureStore.setItemAsync(
      key,
      JSON.stringify({ version: RECORD_VERSION, salt, verifier }),
    );
  } catch {
    throw error;
  }
}

export async function verifyPin(userId, pin) {
  if (!/^\d{6}$/.test(String(pin))) return false;

  const record = await readRecord(userId);
  if (!record) return false;

  const verifier = await createVerifier(userId, pin, record.salt);
  return verifier === record.verifier;
}
