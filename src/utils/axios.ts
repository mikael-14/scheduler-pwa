import axios from 'axios';
import { jwtUtils } from './jwt';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

axiosInstance.interceptors.request.use(config => {
  const token = jwtUtils.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      jwtUtils.removeToken();
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;