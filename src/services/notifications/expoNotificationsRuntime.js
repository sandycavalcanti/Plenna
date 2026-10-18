import Constants from 'expo-constants';

export function isExpoGo(constants = Constants) {
  // In SDK 55, expoGoConfig is also populated from the embedded app config in
  // a native development build. Use the legacy ownership marker when it is
  // available, and keep expoGoConfig as a fallback for test/web-shaped values.
  const hasExplicitOwnership = constants?.appOwnership != null;
  const expoGo = hasExplicitOwnership
    ? constants.appOwnership === 'expo'
    : constants?.executionEnvironment === 'bare' || constants?.executionEnvironment === 'standalone'
      ? false
      : constants?.expoGoConfig != null;
  return expoGo;
}

export function getExpoNotifications(constants = Constants) {
  if (isExpoGo(constants)) return null;

  // Metro keeps this CommonJS dependency lazy: the package is resolved in the
  // bundle, but evaluated only when this function is called in a native build.
  return require('expo-notifications');
}
