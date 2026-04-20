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

// Listeners for global events (set from components)
let _onSessionLocked = null;
let _onPermissionDenied = null;
let _onServerError = null;

export function setSessionLockedHandler(fn) { _onSessionLocked = fn; }
export function setPermissionDeniedHandler(fn) { _onPermissionDenied = fn; }
export function setServerErrorHandler(fn) { _onServerError = fn; }

// Response interceptor – handle 401 / 403 / 500 and standardise errors
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const body = error.response?.data;

    if (status === 401) {
      if (body?.locked === true) {
        // Session auto-expired → PIN re-entry
        if (_onSessionLocked) {
          _onSessionLocked();
        } else {
          await SecureStore.deleteItemAsync('auth_token');
          resetTo('Auth');
        }
      } else {
        await SecureStore.deleteItemAsync('auth_token');
        resetTo('Auth');
      }
    } else if (status === 403) {
      if (_onPermissionDenied) {
        _onPermissionDenied(body?.message || "You don't have permission to perform this action.");
      }
    } else if (status >= 500 || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      if (_onServerError) {
        const msg =
          error.message === 'Network Error' || error.code === 'ERR_NETWORK'
            ? 'Unable to connect to server. Please check your connection.'
            : error.code === 'ECONNABORTED'
            ? 'Request timed out. Please try again.'
            : 'Something went wrong. Please try again.';
        _onServerError(msg);
      }
    }

    let message = body?.message;
    if (!message) {
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        message = 'Unable to connect to server. Please check your connection.';
      } else if (error.code === 'ECONNABORTED') {
        message = 'Request timed out. Please try again.';
      } else {
        message = error.message || 'Something went wrong.';
      }
    }
    const errors = body?.errors || {};

    return Promise.reject({ message, errors, status });
  },
);

export default client;
