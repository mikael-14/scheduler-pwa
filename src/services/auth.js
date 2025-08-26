import axiosInstance from '../utils/axios';
import { jwtUtils } from '../utils/jwt';
export const authService = {
    async login(credentials) {
        const response = await axiosInstance.post('/login', credentials);
        if (response.data.token) {
            jwtUtils.setToken(response.data.token);
        }
        return response.data;
    },
    async loginWithSocial(provider, accessToken) {
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
//# sourceMappingURL=auth.js.map