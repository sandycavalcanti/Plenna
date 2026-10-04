import { useEffect, useRef } from 'react';
import { getExpoNotifications, isExpoGo } from '../services/notifications/expoNotificationsRuntime';
import { registerAuthenticatedDevice } from '../services/notifications/notificationService';

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
        .catch(() => ({ status: 'registration-failed' }))
        .finally(() => {
          registrationPromise = null;
        });
      return registrationPromise;
    };

    register(true);

    const tokenSubscription = Notifications.addPushTokenListener?.((nativeToken) => {
      if (!nativeToken || typeof nativeToken !== 'object' || typeof nativeToken.data !== 'string') return;
      register(false);
    });

    return () => tokenSubscription?.remove?.();
  }, []);
}
