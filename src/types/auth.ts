export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  language?: 'pt' | 'en';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
