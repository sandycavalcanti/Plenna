import Constants from 'expo-constants';

export function isExpoGo(constants = Constants) {
  return constants?.expoGoConfig != null;
}

export function getExpoNotifications(constants = Constants) {
  if (isExpoGo(constants)) return null;

  // Metro keeps this CommonJS dependency lazy: the package is resolved in the
  // bundle, but evaluated only when this function is called in a native build.
  return require('expo-notifications');
}
