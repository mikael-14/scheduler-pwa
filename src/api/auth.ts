import axiosInstance from '../config/axios';
import { useAuthStore } from '../stores/auth';
import type { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../types/auth';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axiosInstance.post('/auth/login', credentials);
    const { token, user } = response.data;
    const authStore = useAuthStore();
    authStore.setToken(token);
    authStore.setUser(user);
    return response.data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await axiosInstance.post('/auth/register', credentials);
    const { token, user } = response.data;
    const authStore = useAuthStore();
    authStore.setToken(token);
    authStore.setUser(user);
    return response.data;
  },

  async getSocialRedirect(provider: 'facebook' | 'google') {
    const response = await axiosInstance.get(`/auth/${provider}/redirect`);
    return response.data;
  },

  async logout() {
    try {
      await axiosInstance.post('/auth/logout');
    } finally {
      const authStore = useAuthStore();
      authStore.logout();
    }
  },

  async getCurrentUser() {
    const response = await axiosInstance.get('/user');
    // The API returns the user object nested under a 'user' key.
    // We need to extract it before setting it in the store.
    const user = response.data.user || response.data;
    const authStore = useAuthStore();
    authStore.setUser(user);
    return response.data;
  },

  async updateProfile(data: Partial<User>) {
    const response = await axiosInstance.patch('/user', data);
    const authStore = useAuthStore();
    authStore.setUser(response.data);
    return response.data;
  }
};
