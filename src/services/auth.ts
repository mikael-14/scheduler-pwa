import axiosInstance from '../utils/axios';
import { jwtUtils } from '../utils/jwt';

export interface LoginCredentials {
  username: string;
  password: string;
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await axiosInstance.post('/login', credentials);
    if (response.data.token) {
      jwtUtils.setToken(response.data.token);
    }
    return response.data;
  },

  async loginWithSocial(provider: 'facebook' | 'google', accessToken: string) {
    const response = await axiosInstance.post(`/auth/${provider}`, { access_token: accessToken });
    if (response.data.token) {
      jwtUtils.setToken(response.data.token);
    }
    return response.data;
  },

  logout() {
    jwtUtils.removeToken();
  },

  isAuthenticated() {
    return jwtUtils.isValid();
  }
};