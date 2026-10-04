import { createNavigationContainerRef } from '@react-navigation/native';
import { SUPPORTED_NOTIFICATION_TYPES } from './notificationConstants';

export const notificationNavigationRef = createNavigationContainerRef();

const NOTIFICATION_ROUTE = 'Notifications';
let pendingNotificationIntent = null;

function normalizeNotificationId(value) {
  if (Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function extractNotificationIntent(response) {
  const data = response?.notification?.request?.content?.data;
  if (!data || typeof data !== 'object') return null;

  const notificationId = normalizeNotificationId(data.notificationId);
  const type = typeof data.type === 'string' ? data.type : null;
  if (!notificationId || !type || !SUPPORTED_NOTIFICATION_TYPES.has(type)) return null;

  return { notificationId, type };
}

function availableNotificationRoute(navigation) {
  const state = navigation?.getState?.();
  const routeNames = Array.isArray(state?.routeNames) ? state.routeNames : [];
  return routeNames.includes(NOTIFICATION_ROUTE) ? NOTIFICATION_ROUTE : null;
}

function navigateIfPossible(intent, navigation) {
  if (!intent || !navigation?.isReady?.()) return false;

  const routeName = availableNotificationRoute(navigation);
  if (!routeName) return false;

  navigation.navigate(routeName, intent);
  return true;
}

export function deliverNotificationIntent(intent, navigation = notificationNavigationRef) {
  if (!intent) return false;
  if (navigateIfPossible(intent, navigation)) return true;

  pendingNotificationIntent = intent;
  return false;
}

export function consumePendingNotificationIntent(navigation = notificationNavigationRef) {
  if (!pendingNotificationIntent) return null;
  if (!navigateIfPossible(pendingNotificationIntent, navigation)) return null;

  const intent = pendingNotificationIntent;
  pendingNotificationIntent = null;
  return intent;
}

export function getPendingNotificationIntent() {
  return pendingNotificationIntent;
}

export function clearPendingNotificationIntent() {
  pendingNotificationIntent = null;
}
