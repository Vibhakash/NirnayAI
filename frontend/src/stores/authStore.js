import { create } from 'zustand';
import { authAPI } from '@/services/api';
export const useAuthStore = create((set) => ({
    user: null,
    token: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authAPI.login(email, password);
            const { access_token, user } = response.data;
            // Store token and user
            localStorage.setItem('auth_token', access_token);
            localStorage.setItem('user', JSON.stringify(user));
            set({
                token: access_token,
                user,
                isAuthenticated: true,
                isLoading: false,
            });
        }
        catch (error) {
            const errorMessage = error.response?.data?.detail || 'Login failed. Please check your credentials.';
            set({
                error: errorMessage,
                isLoading: false,
                isAuthenticated: false,
            });
            throw error;
        }
    },
    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
        });
    },
    setUser: (user) => {
        set({ user });
    },
    setToken: (token) => {
        set({ token });
    },
    clearError: () => {
        set({ error: null });
    },
    initializeAuth: () => {
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                set({
                    token,
                    user,
                    isAuthenticated: true,
                });
            }
            catch (error) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                });
            }
        }
    },
}));
