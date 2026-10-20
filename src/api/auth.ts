import axiosInstance from '../config/axios';
import { useAuthStore } from '../stores/auth';
import type { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../types/auth';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axiosInstance.post('/auth/login', credentials);
    const { token, user, permissions } = response.data;
    const authStore = useAuthStore();
    authStore.setToken(token);
    authStore.setUser(user);
    authStore.setPermissions(permissions);
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

  /** Swaps the current token for a fresh one (the old one keeps working a few minutes). */
  async refreshToken() {
    const response = await axiosInstance.post('/auth/refresh');
    useAuthStore().setToken(response.data.token);
  },

  /** Revokes the token on the server. Clearing the local session is the auth store's job. */
  async logout() {
    await axiosInstance.post('/auth/logout');
  },

  async getCurrentUser() {
    const response = await axiosInstance.get('/user');
    // The API returns the user object nested under a 'user' key.
    // We need to extract it before setting it in the store.
    const user = response.data.user || response.data;
    const authStore = useAuthStore();
    authStore.setUser(user);
    authStore.setPermissions(response.data.permissions);
    return response.data;
  },

  async updatePassword(data: { current_password?: string; password: string; password_confirmation: string }) {
    const response = await axiosInstance.patch('/user', data);
    return response.data;
  },

  async updateProfile(data: Partial<User>) {
    // The API stores the language as `locale`
    const { language, ...rest } = data;
    const payload = language ? { ...rest, locale: language } : rest;

    const response = await axiosInstance.patch('/user', payload);
    return keepUser(response.data.user, language);
  },

  /** jpg, png or webp up to 2 MB; replaces the previous photo. */
  async uploadAvatar(file: File): Promise<User> {
    const body = new FormData();
    body.append('avatar', file);
    const response = await axiosInstance.post('/user/avatar', body);
    return keepUser(response.data.user);
  },

  async deleteAvatar(): Promise<User> {
    const response = await axiosInstance.delete('/user/avatar');
    return keepUser(response.data.user);
  },

  /** Devices signed in to this account, most recently used first. */
  async sessions(): Promise<DeviceSession[]> {
    const response = await axiosInstance.get('/user/sessions');
    return response.data.data;
  },

  async revokeSession(id: number): Promise<void> {
    await axiosInstance.delete(`/user/sessions/${id}`);
  },

  async revokeOtherSessions(): Promise<string> {
    const response = await axiosInstance.delete('/user/sessions');
    return response.data.message;
  },

  /** Always answers the same message, whether or not the email has an account. */
  async forgotPassword(email: string): Promise<string> {
    const response = await axiosInstance.post('/auth/forgot-password', { email });
    return response.data.message;
  },

  /** Sets the new password from the emailed link; signs out every device of the account. */
  async resetPassword(data: { token: string; email: string; password: string; password_confirmation: string }): Promise<string> {
    const response = await axiosInstance.post('/auth/reset-password', data);
    return response.data.message;
  },
};

export interface DeviceSession {
  id: number;
  /** e.g. "Chrome · Android" */
  name: string;
  created_at: string;
  last_used_at: string | null;
  /** this device */
  current: boolean;
}

/** The API answers { message, user } after a change: store the fresh user. */
function keepUser(fields: Partial<User>, language?: User['language']): User {
  const authStore = useAuthStore();
  const updated = {
    ...authStore.user,
    ...fields,
    language: (fields.locale as User['language']) ?? language ?? authStore.user?.language,
  } as User;
  authStore.setUser(updated);
  return updated;
}
