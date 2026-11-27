export type EmailDigest = 'instant' | 'twice' | 'daily';

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
  /** "all notifications": other people's schedules too */
  all_email_notification?: boolean;
  all_push_notification?: boolean;
  /** the emails that can wait: each right away, or in a summary twice / once a day */
  email_digest?: EmailDigest;
  /** a push now and then while an important notification is unread (server config/reminders.php) */
  push_reminders?: boolean;
  approved_at?: string | null;
  /** null until the email is confirmed (password sign-ups, after an email change) */
  email_verified_at?: string | null;
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
  /** honeypot: hidden from people, only bots fill it in */
  website?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
