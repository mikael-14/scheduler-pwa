/// <reference types="vite/client" />
import axios from 'axios';
import { jwtUtils } from './jwt';
const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const axiosInstance = axios.create({
    baseURL: apiUrl
});
axiosInstance.interceptors.request.use(config => {
    const token = jwtUtils.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
axiosInstance.interceptors.response.use(response => response, async (error) => {
    if (error.response?.status === 401) {
        jwtUtils.removeToken();
        window.location.reload();
    }
    return Promise.reject(error);
});
export default axiosInstance;
//# sourceMappingURL=axios.js.map