import { AppState } from 'react-native';
import { useEffect, useRef } from 'react';
import { getExpoNotifications, isExpoGo } from '../services/notifications/expoNotificationsRuntime';
import { registerAuthenticatedDevice } from '../services/notifications/notificationService';
import { urlAPI } from '../constants/config';

function safeApiOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return 'invalid-url';
  }
}

function reportRegistrationResult(result) {
  if (result?.status === 'registered') return result;

  // Never include the Expo/native token or the Axios request object here.
  // The base URL and status are enough to distinguish permission, routing and
  // backend failures in a Development Build without exposing credentials.
  console.warn('PUSH_REGISTRATION_NOT_COMPLETED', {
    status: result?.status ?? 'unknown',
    httpStatus: result?.httpStatus ?? null,
    errorCode: result?.errorCode ?? null,
    endpoint: '/devices/push',
    apiOrigin: safeApiOrigin(urlAPI),
  });

  return result;
}

export function useNotificationRegistration() {
  const started = useRef(false);

  useEffect(() => {
    if (isExpoGo()) return undefined;
    if (started.current) return undefined;
    started.current = true;

    const Notifications = getExpoNotifications();
    if (!Notifications) return undefined;

    let registrationPromise = null;
    const register = (requestPermission) => {
      if (registrationPromise) return registrationPromise;

      registrationPromise = registerAuthenticatedDevice({ requestPermission })
        .then(reportRegistrationResult)
        .catch((error) => reportRegistrationResult({
          status: 'registration-failed',
          httpStatus: error?.response?.status ?? null,
          errorCode: error?.code ?? null,
        }))
        .finally(() => {
          registrationPromise = null;
        });
      return registrationPromise;
    };

    register(true);

    const appStateSubscription = AppState.addEventListener?.('change', (nextState) => {
      if (nextState === 'active') register(false);
    });

    const tokenSubscription = Notifications.addPushTokenListener?.((nativeToken) => {
      if (!nativeToken || typeof nativeToken !== 'object' || typeof nativeToken.data !== 'string') return;
      register(false);
    });

    return () => {
      appStateSubscription?.remove?.();
      tokenSubscription?.remove?.();
    };
  }, []);
}
