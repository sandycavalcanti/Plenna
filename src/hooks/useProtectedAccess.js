import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { apiClient } from '../api/client';
import { authenticateWithBiometrics, cancelBiometricAuthentication } from '../services/security/biometricService';
import { getPinRecord, savePin, verifyPin } from '../services/security/pinStorage';
import {
  invalidateProtectedSession,
  isProtectedSessionUnlocked,
  unlockProtectedSession,
} from '../services/security/protectedSession';

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 1000;

export const PROTECTED_ACCESS_STATES = {
  LOCKED: 'locked',
  CHECKING: 'checking',
  BIOMETRIC: 'biometric',
  PIN: 'pin',
  SETUP: 'setup',
  LOCKOUT: 'lockout',
  UNLOCKED: 'unlocked',
  ERROR: 'error',
};

export function useProtectedAccess() {
  const [status, setStatus] = useState(PROTECTED_ACCESS_STATES.LOCKED);
  const [userId, setUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [lifecycleRevision, setLifecycleRevision] = useState(0);
  const requestInProgress = useRef(false);
  const lockoutTimer = useRef(null);

  const clearLockoutTimer = useCallback(() => {
    if (lockoutTimer.current) {
      clearTimeout(lockoutTimer.current);
      lockoutTimer.current = null;
    }
  }, []);

  useEffect(() => () => clearLockoutTimer(), [clearLockoutTimer]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        // O serviço também invalida a sessão global; este estado local é
        // atualizado para que a tela deixe de renderizar compras imediatamente.
        invalidateProtectedSession();
        setStatus(PROTECTED_ACCESS_STATES.LOCKED);
        setLifecycleRevision((revision) => revision + 1);
      }
    });

    return () => subscription.remove();
  }, []);

  const unlock = useCallback((currentUserId) => {
    unlockProtectedSession(currentUserId);
    setStatus(PROTECTED_ACCESS_STATES.UNLOCKED);
    setErrorMessage('');
    setPinAttempts(0);
    clearLockoutTimer();
  }, [clearLockoutTimer]);

  const beginAccess = useCallback(async ({ forceReauthentication = false } = {}) => {
    if (requestInProgress.current) return;
    requestInProgress.current = true;
    setErrorMessage('');
    setStatus(PROTECTED_ACCESS_STATES.CHECKING);
    try {
      // O endpoint de usuário identifica o usuario_id pelo JWT. Ele é usado
      // somente para selecionar o namespace correto do SecureStore; nenhuma
      // compra é solicitada durante o gate.
      const response = await apiClient.get('/users/user');
      const currentUserId = String(response.data?.usuario_id || '');
      if (!currentUserId) throw new Error('Usuário autenticado não identificado.');

      setUserId(currentUserId);

      // A sessão curta evita repetir a biometria em pequenas trocas de tela.
      // A alteração de PIN é uma ação crítica e usa reautenticação forçada,
      // portanto não pode reutilizar um desbloqueio anterior em memória.
      if (!forceReauthentication && isProtectedSessionUnlocked(currentUserId)) {
        setStatus(PROTECTED_ACCESS_STATES.UNLOCKED);
        return;
      }

      const pinRecord = await getPinRecord(currentUserId);
      setSetupCompleted(false);

      if (!pinRecord) {
        // Sem PIN cadastrado, o primeiro acesso precisa criar o fallback antes
        // de qualquer conteúdo financeiro ser carregado.
        setStatus(PROTECTED_ACCESS_STATES.SETUP);
        return;
      }

      setStatus(PROTECTED_ACCESS_STATES.BIOMETRIC);
      const biometricResult = await authenticateWithBiometrics();
      if (biometricResult.success) {
        unlock(currentUserId);
      } else {
        // Falha, cancelamento, ausência de hardware ou bloqueio biométrico
        // continuam bloqueando a tela e apenas oferecem o PIN do Plenna.
        setStatus(PROTECTED_ACCESS_STATES.PIN);
      }
    } catch {
      setStatus(PROTECTED_ACCESS_STATES.ERROR);
      setErrorMessage('Não foi possível preparar a autenticação local. Tente novamente.');
    } finally {
      requestInProgress.current = false;
    }
  }, [unlock]);

  const completeSetup = useCallback(async (pin, confirmation) => {
    if (pin !== confirmation) {
      setErrorMessage('Os PINs não coincidem. Confira e tente novamente.');
      return false;
    }

    if (!/^\d{6}$/.test(pin)) {
      setErrorMessage('O PIN deve possuir exatamente 6 dígitos.');
      return false;
    }

    try {
      await savePin(userId, pin);
      setSetupCompleted(true);

      // A confirmação do novo PIN é uma autenticação local válida. O próximo
      // acesso, já com PIN configurado, priorizará biometria normalmente.
      unlock(userId);
      return true;
    } catch {
      setErrorMessage('Não foi possível salvar o PIN com segurança. Tente novamente.');
      return false;
    }
  }, [unlock, userId]);

  const submitPin = useCallback(async (pin) => {
    if (status === PROTECTED_ACCESS_STATES.LOCKOUT || !userId) return false;

    if (!/^\d{6}$/.test(pin)) {
      setErrorMessage('Digite os 6 dígitos do seu PIN.');
      return false;
    }

    let valid;
    try {
      valid = await verifyPin(userId, pin);
    } catch {
      // Falha de SecureStore ou Crypto não significa PIN incorreto. A área
      // continua bloqueada e o detalhe técnico não é exposto ao usuário.
      setErrorMessage('Não foi possível validar o PIN. Tente novamente.');
      return false;
    }
    if (valid) {
      unlock(userId);
      return true;
    }

    const nextAttempts = pinAttempts + 1;
    setPinAttempts(nextAttempts);

    if (nextAttempts >= MAX_PIN_ATTEMPTS) {
      setStatus(PROTECTED_ACCESS_STATES.LOCKOUT);
      setErrorMessage('Muitas tentativas. Aguarde 30 segundos para tentar novamente.');
      lockoutTimer.current = setTimeout(() => {
        setPinAttempts(0);
        setErrorMessage('');
        setStatus(PROTECTED_ACCESS_STATES.PIN);
        lockoutTimer.current = null;
      }, LOCKOUT_MS);
    } else {
      setErrorMessage('PIN incorreto. Confira os dígitos e tente novamente.');
    }

    return false;
  }, [pinAttempts, status, unlock, userId]);

  const changePin = useCallback(async (pin, confirmation) => {
    if (pin !== confirmation) {
      setErrorMessage('Os PINs não coincidem. Confira e tente novamente.');
      return false;
    }

    if (!/^\d{6}$/.test(pin)) {
      setErrorMessage('O PIN deve possuir exatamente 6 dígitos.');
      return false;
    }

    try {
      await savePin(userId, pin);
      setErrorMessage('');
      return true;
    } catch {
      setErrorMessage('Não foi possível alterar o PIN com segurança.');
      return false;
    }
  }, [userId]);

  const cancelAccess = useCallback(() => {
    clearLockoutTimer();
    setStatus(PROTECTED_ACCESS_STATES.LOCKED);
    setErrorMessage('');
  }, [clearLockoutTimer]);

  const usePinFallback = useCallback(async () => {
    if (status === PROTECTED_ACCESS_STATES.BIOMETRIC) {
      await cancelBiometricAuthentication();
      setStatus(PROTECTED_ACCESS_STATES.PIN);
      setErrorMessage('');
    }
  }, [status]);

  return {
    status,
    userId,
    errorMessage,
    setupCompleted,
    lifecycleRevision,
    beginAccess,
    completeSetup,
    submitPin,
    changePin,
    cancelAccess,
    usePinFallback,
  };
}
