import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { resetTo } from '../navigation/navigationRef';

const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor – attach Bearer token
client.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor – handle 401 and standardise errors
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      resetTo('Auth');
    }

    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    const errors = error.response?.data?.errors || {};

    return Promise.reject({ message, errors });
  },
);

export default client;
