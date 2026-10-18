import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EXPO_PUSH_TOKEN_STORAGE_KEY,
  NOTIFICATION_PERMISSION_PROMPTED_STORAGE_KEY,
} from './notificationConstants';

export const notificationStorage = {
  async getExpoPushToken() {
    return AsyncStorage.getItem(EXPO_PUSH_TOKEN_STORAGE_KEY);
  },

  async setExpoPushToken(token) {
    await AsyncStorage.setItem(EXPO_PUSH_TOKEN_STORAGE_KEY, token);
  },

  async clearExpoPushToken() {
    await AsyncStorage.removeItem(EXPO_PUSH_TOKEN_STORAGE_KEY);
  },

  async wasPermissionPrompted() {
    return (await AsyncStorage.getItem(NOTIFICATION_PERMISSION_PROMPTED_STORAGE_KEY)) === 'true';
  },

  async markPermissionPrompted() {
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_PROMPTED_STORAGE_KEY, 'true');
  },
};
