import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiClient } from '../../api/client';
import { notificationStorage } from './notificationStorage';
import { deliverNotificationIntent, extractNotificationIntent, notificationNavigationRef } from './notificationNavigation';
import { NOTIFICATION_CHANNEL_ID, NOTIFICATION_CHANNEL_NAME } from './notificationConstants';
import { getExpoNotifications, isExpoGo } from './expoNotificationsRuntime';

export { isExpoGo } from './expoNotificationsRuntime';

const FOREGROUND_NOTIFICATION_BEHAVIOR = {
  shouldShowBanner: true,
  shouldShowList: true,
  shouldPlaySound: false,
  shouldSetBadge: false,
};

let foregroundHandlerConfigured = false;

export function configureForegroundNotificationHandler(notifications) {
  if (isExpoGo()) return false;
  const runtimeNotifications = notifications ?? getExpoNotifications();
  if (!runtimeNotifications) return false;
  if (foregroundHandlerConfigured) return false;

  runtimeNotifications.setNotificationHandler({
    handle: async () => FOREGROUND_NOTIFICATION_BEHAVIOR,
  });
  foregroundHandlerConfigured = true;
  return true;
}

export async function ensureAndroidNotificationChannel({
  notifications,
  platform = Platform.OS,
} = {}) {
  if (platform !== 'android') return { status: 'not-required' };

  if (isExpoGo()) return { status: 'expo-go-skipped' };
  const runtimeNotifications = notifications ?? getExpoNotifications();
  if (!runtimeNotifications) return { status: 'expo-go-skipped' };

  await runtimeNotifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: NOTIFICATION_CHANNEL_NAME,
    importance: runtimeNotifications.AndroidImportance.DEFAULT,
    sound: null,
    showBadge: false,
  });

  return { status: 'ready' };
}

export function resolveExpoProjectId(constants = Constants) {
  return constants?.expoConfig?.extra?.eas?.projectId
    ?? constants?.easConfig?.projectId
    ?? null;
}

function permissionGranted(permission) {
  return permission?.granted === true || permission?.status === 'granted';
}

function permissionDenied(permission) {
  return permission?.status === 'denied';
}

function showPermissionExplanation(alert = Alert) {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (shouldRequest) => {
      if (resolved) return;
      resolved = true;
      resolve(shouldRequest);
    };

    alert.alert(
      'Ativar notificações',
      'O Plenna pode enviar alertas sobre seu planejamento de gastos mesmo quando o aplicativo não estiver aberto.',
      [
        { text: 'Agora não', style: 'cancel', onPress: () => finish(false) },
        { text: 'Ativar notificações', onPress: () => finish(true) },
      ],
      { cancelable: true, onDismiss: () => finish(false) },
    );
  });
}

async function obtainAndRegisterToken({ notifications, constants, api, storage, platform }) {
  const projectId = resolveExpoProjectId(constants);
  if (!projectId) return { status: 'missing-project-id' };

  const tokenResult = await notifications.getExpoPushTokenAsync({ projectId });
  const pushToken = typeof tokenResult?.data === 'string' ? tokenResult.data.trim() : '';
  if (!pushToken) return { status: 'token-unavailable' };

  await api.post('/devices/push', {
    pushToken,
    platform,
  });
  await storage.setExpoPushToken(pushToken);

  return { status: 'registered' };
}

export async function registerAuthenticatedDevice({
  notifications,
  constants = Constants,
  api = apiClient,
  storage = notificationStorage,
  alert = Alert,
  platform = Platform.OS,
  requestPermission = true,
} = {}) {
  if (isExpoGo(constants)) return { status: 'expo-go-unsupported' };
  if (platform !== 'android') return { status: 'unsupported-platform' };

  try {
    const runtimeNotifications = notifications ?? getExpoNotifications(constants);
    if (!runtimeNotifications) return { status: 'expo-go-unsupported' };

    await ensureAndroidNotificationChannel({ notifications: runtimeNotifications, platform });
    let permission = await runtimeNotifications.getPermissionsAsync();

    if (permissionDenied(permission)) return { status: 'permission-denied' };

    if (!permissionGranted(permission)) {
      if (!requestPermission) return { status: 'permission-undetermined' };

      if (await storage.wasPermissionPrompted()) return { status: 'prompt-skipped' };
      await storage.markPermissionPrompted();

      const shouldRequest = await showPermissionExplanation(alert);
      if (!shouldRequest) return { status: 'prompt-declined' };

      permission = await runtimeNotifications.requestPermissionsAsync();
      if (!permissionGranted(permission)) return { status: 'permission-denied' };
    }

    return await obtainAndRegisterToken({ notifications: runtimeNotifications, constants, api, storage, platform });
  } catch {
    return { status: 'registration-failed' };
  }
}

export async function disableRegisteredDevice({
  api = apiClient,
  storage = notificationStorage,
} = {}) {
  try {
    const pushToken = await storage.getExpoPushToken();
    if (!pushToken) return { status: 'no-token' };

    await api.delete('/devices/push/current', {
      data: { pushToken },
    });
    return { status: 'disabled' };
  } catch {
    return { status: 'disable-failed' };
  } finally {
    try {
      await storage.clearExpoPushToken();
    } catch {
      // Logout must remain best-effort even if local storage is unavailable.
    }
  }
}

export function setupNotificationResponseHandling({
  notifications,
  navigation = notificationNavigationRef,
} = {}) {
  if (isExpoGo()) return () => {};
  const runtimeNotifications = notifications ?? getExpoNotifications();
  if (!runtimeNotifications) return () => {};

  const seenResponses = new WeakSet();
  const seenIdentifiers = new Set();
  let active = true;

  const handleResponse = (response) => {
    if (!active || !response || typeof response !== 'object') return;
    if (seenResponses.has(response)) return;
    seenResponses.add(response);

    const intent = extractNotificationIntent(response);
    if (!intent) return;

    const identifier = response.notification?.request?.identifier;
    if (typeof identifier === 'string' && identifier) {
      if (seenIdentifiers.has(identifier)) return;
      seenIdentifiers.add(identifier);
    }

    deliverNotificationIntent(intent, navigation);
  };

  const subscription = runtimeNotifications.addNotificationResponseReceivedListener(handleResponse);
  const lastResponsePromise = runtimeNotifications.getLastNotificationResponseAsync?.();
  if (lastResponsePromise?.then) {
    lastResponsePromise.then((response) => handleResponse(response)).catch(() => {});
  }

  return () => {
    active = false;
    subscription?.remove?.();
  };
}

export const notificationForegroundBehavior = FOREGROUND_NOTIFICATION_BEHAVIOR;
