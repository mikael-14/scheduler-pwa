export const jwtUtils = {
  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  },

  setToken(token: string): void {
    localStorage.setItem('jwt_token', token);
  },

  removeToken(): void {
    localStorage.removeItem('jwt_token');
  },

  isValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }
};