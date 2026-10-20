export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  language?: 'pt' | 'en';
  /** What the API calls the language; mapped to `language` by the auth store. */
  locale?: string;
  email_notification?: boolean;
  push_notification?: boolean;
  approved_at?: string | null;
  /** false for accounts made with Google / Facebook that never set a password */
  has_password?: boolean;
  /** linked sign-in providers, e.g. ['google'] */
  providers?: string[];
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
  locale?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
