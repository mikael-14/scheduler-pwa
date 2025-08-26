export const jwtUtils = {
    getToken() {
        return localStorage.getItem('jwt_token');
    },
    setToken(token) {
        localStorage.setItem('jwt_token', token);
    },
    removeToken() {
        localStorage.removeItem('jwt_token');
    },
    isValid() {
        const token = this.getToken();
        if (!token)
            return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        }
        catch {
            return false;
        }
    }
};
//# sourceMappingURL=jwt.js.map