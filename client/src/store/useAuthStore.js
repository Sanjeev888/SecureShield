import { create } from 'zustand';
import axios from 'axios';

const useAuthStore = create((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/v1/auth/login', { email, password });
      const { user, tokens } = response.data;
      set({ user, tokens, isAuthenticated: true, isLoading: false });
      // In a real app, store tokens in localStorage or HttpOnly cookies
      localStorage.setItem('tokens', JSON.stringify(tokens));
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true };
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false
      });
      return { success: false, error: error.response?.data?.message };
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/v1/auth/register', { name, email, password });
      const { user, tokens } = response.data;
      set({ user, tokens, isAuthenticated: true, isLoading: false });
      localStorage.setItem('tokens', JSON.stringify(tokens));
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true };
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false
      });
      return { success: false, error: error.response?.data?.message };
    }
  },

  logout: async () => {
    try {
      const tokensStr = localStorage.getItem('tokens');
      if (tokensStr) {
        const tokens = JSON.parse(tokensStr);
        await axios.post('/v1/auth/logout', { refreshToken: tokens.refresh.token });
      }
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      set({ user: null, tokens: null, isAuthenticated: false });
      localStorage.removeItem('tokens');
      localStorage.removeItem('user');
    }
  },

  checkAuth: () => {
    const tokensStr = localStorage.getItem('tokens');
    const userStr = localStorage.getItem('user');
    if (tokensStr && userStr) {
      try {
        const tokens = JSON.parse(tokensStr);
        const user = JSON.parse(userStr);
        // Simple check for expiration could be added here
        set({ user, tokens, isAuthenticated: true, isLoading: false });
      } catch (e) {
        set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
    }
  }
}));

export default useAuthStore;
