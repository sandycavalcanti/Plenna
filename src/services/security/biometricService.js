import * as LocalAuthentication from 'expo-local-authentication';

export async function getBiometricAvailability() {
  let hasHardware;
  try {
    hasHardware = await LocalAuthentication.hasHardwareAsync();
  } catch (error) {
    throw error;
  }

  if (!hasHardware) {
    return { available: false, hasHardware: false, isEnrolled: false, supportedTypes: [] };
  }

  let isEnrolled;
  let supportedTypes;
  try {
    const enrolledPromise = LocalAuthentication.isEnrolledAsync();
    const supportedTypesPromise = LocalAuthentication.supportedAuthenticationTypesAsync();

    [isEnrolled, supportedTypes] = await Promise.all([enrolledPromise, supportedTypesPromise]);
  } catch (error) {
    throw error;
  }

  return {
    available: Boolean(isEnrolled && supportedTypes.length > 0),
    hasHardware,
    isEnrolled,
    supportedTypes,
  };
}

export async function authenticateWithBiometrics() {
  const availability = await getBiometricAvailability();
  if (!availability.available) {
    return { success: false, reason: 'unavailable', availability };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirme sua identidade para acessar suas compras.',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: true,
    });

    if (result.success) {
      return { success: true, availability };
    }

    // Cancelamento, falha, timeout e bloqueio não liberam a tela; o chamador
    // decide oferecer o PIN do Plenna como fallback.
    return { success: false, reason: result.error || 'authentication_failed', availability };
  } catch (error) {
    return { success: false, reason: 'not_available', availability };
  }
}

export async function cancelBiometricAuthentication() {
  try {
    if (typeof LocalAuthentication.cancelAuthenticate === 'function') {
      await LocalAuthentication.cancelAuthenticate();
    }
  } catch {
    // O prompt pode já ter encerrado sozinho; em ambos os casos o gate
    // continuará bloqueado até o usuário provar o PIN do Plenna.
  }
}
