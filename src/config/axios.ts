/// <reference types="vite/client" />

import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { useConnectionStore } from '../stores/connection';
import { locale } from '../i18n';

const apiUrl = import.meta.env.VITE_API_URL ?? "https://localhost:9443/api";

const axiosInstance = axios.create({
  baseURL: apiUrl,
  // On a bad connection a request fails with a message instead of hanging forever
  timeout: 20000,
});

axiosInstance.interceptors.request.use(config => {
  const authStore = useAuthStore();
  const token = authStore.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // The API answers in this language for guests (login/register errors); for signed-in
  // users it uses their profile language, which is the same value.
  config.headers['Accept-Language'] = locale.value;
  return config;
});

/**
 * Only an answer from the API about the account itself ends or changes the session.
 * Network errors, timeouts and server errors never sign the user out: the caller shows a
 * message and the session is kept (e.g. on a bad connection).
 */
axiosInstance.interceptors.response.use(
  response => {
    useConnectionStore().markUpdated();
    return response;
  },
  async error => {
    // the online / last update indicator in the top bar
    if (error.response) {
      useConnectionStore().markReachable();
    } else if (!axios.isCancel(error)) {
      useConnectionStore().markUnreachable();
    }

    const authStore = useAuthStore();
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (authStore.isAuthenticated() && !authStore.loggingOut) {
      if (status === 401) {
        // the token is no longer valid (expired or revoked)
        authStore.endSession('session_expired');
      } else if (status === 403 && code === 'account_inactive') {
        authStore.endSession('account_inactive');
      } else if (status === 403 && code === 'account_pending') {
        authStore.markPending();
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
