import axios from 'axios';
import { urlAPI } from '../constants/config';
import { tokenStorage } from './tokenStorage';

export const apiClient = axios.create({
  baseURL: urlAPI,
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
