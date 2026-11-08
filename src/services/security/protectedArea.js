export const PROTECTED_ACCESS_AREAS = Object.freeze({
  PURCHASES: 'purchases',
  NOTIFICATIONS: 'notifications',
  MEMORIES: 'memories',
  PROFILE_SECURITY: 'profile-security',
});

const AREA_ROUTES = Object.freeze({
  [PROTECTED_ACCESS_AREAS.PURCHASES]: new Set(['Purchases', 'Recurrences']),
  [PROTECTED_ACCESS_AREAS.NOTIFICATIONS]: new Set(['Notifications']),
  [PROTECTED_ACCESS_AREAS.MEMORIES]: new Set(['MemoryList']),
  [PROTECTED_ACCESS_AREAS.PROFILE_SECURITY]: new Set(),
});

export function isRouteInProtectedArea(area, routeName) {
  return Boolean(AREA_ROUTES[area]?.has(routeName));
}

export function shouldPreserveProtectedSession(area, navigation) {
  const state = navigation?.getState?.();
  const activeRoute = state?.routes?.[state.index];
  return isRouteInProtectedArea(area, activeRoute?.name);
}
