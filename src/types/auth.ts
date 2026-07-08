export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  language?: 'pt' | 'en';
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  roles: string[];
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
