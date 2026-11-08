import { AppState } from 'react-native';

// A sessão protegida é deliberadamente mantida apenas em memória. Isso evita
// que uma flag persistida em disco transforme um aparelho já desbloqueado em
// acesso permanente aos dados protegidos. A sessão também é associada à área
// que foi desbloqueada, impedindo que uma autorização de Compras libere
// Notificações, Memórias ou outra área protegida.
let unlockedSession = null;
let appStateSubscription = null;

function normalizeUserId(userId) {
  if (userId === null || userId === undefined || userId === '') return null;
  return String(userId);
}

function normalizeArea(area) {
  if (area === null || area === undefined || area === '') return 'default';
  return String(area);
}

export function unlockProtectedSession(userId, area = 'default') {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) return false;

  unlockedSession = {
    userId: normalizedUserId,
    area: normalizeArea(area),
  };
  return true;
}

export function isProtectedSessionUnlocked(userId, area = 'default') {
  const normalizedUserId = normalizeUserId(userId);
  return Boolean(
    normalizedUserId
    && unlockedSession?.userId === normalizedUserId
    && unlockedSession.area === normalizeArea(area),
  );
}

export function invalidateProtectedSession() {
  // O logout, a troca de usuário e o background precisam remover a sessão
  // imediatamente. Nenhum segredo ou estado de desbloqueio é persistido.
  unlockedSession = null;
}

export function subscribeToProtectedAppState() {
  if (appStateSubscription) return () => {};

  appStateSubscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'background' || nextState === 'inactive') {
      invalidateProtectedSession();
    }
  });

  return () => {
    appStateSubscription?.remove();
    appStateSubscription = null;
  };
}
