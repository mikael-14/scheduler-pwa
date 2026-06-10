/// <reference types="vite/client" />

import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const apiUrl = import.meta.env.VITE_API_URL ?? "https://localhost:9443/api";

const axiosInstance = axios.create({
  baseURL: apiUrl
});

axiosInstance.interceptors.request.use(config => {
  const authStore = useAuthStore();
  const token = authStore.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
