import axios from 'axios';
import { URL_API } from './constants';
import { tokenStorage } from './tokenStorage';

export const apiClient = axios.create({
  baseURL: URL_API,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getToken();

  config.headers = config.headers || {};

  if (token) {
    config.headers.authorization = `Bearer ${token}`;
  } else {
    delete config.headers.authorization;
  }

  return config;
});
