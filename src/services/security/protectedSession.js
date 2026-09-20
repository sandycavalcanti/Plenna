import { AppState } from 'react-native';

// A sessão de compras é deliberadamente mantida apenas em memória. Isso evita
// que uma flag persistida em disco transforme um aparelho já desbloqueado em
// acesso permanente aos dados financeiros. O valor guardado é somente o
// identificador do usuário que passou pelo gate local nesta execução do app.
let unlockedUserId = null;
let appStateSubscription = null;

function normalizeUserId(userId) {
  if (userId === null || userId === undefined || userId === '') return null;
  return String(userId);
}

export function unlockProtectedSession(userId) {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) return false;

  unlockedUserId = normalizedUserId;
  return true;
}

export function isProtectedSessionUnlocked(userId) {
  const normalizedUserId = normalizeUserId(userId);
  return Boolean(normalizedUserId && unlockedUserId === normalizedUserId);
}

export function invalidateProtectedSession() {
  // O logout, a troca de usuário e o background precisam remover a sessão
  // imediatamente. Nenhum segredo ou estado de desbloqueio é persistido.
  unlockedUserId = null;
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
