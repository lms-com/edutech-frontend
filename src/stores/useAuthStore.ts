import { create } from 'zustand';
import type { User } from '../types/auth';
import { authApi } from '../api/authApi';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
}

const getInitialUser = (): User | null => {
  try {
    const raw = localStorage.getItem('user_info');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getInitialUser(),
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,

  setAuth: (user, token) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_info', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  setUser: (user) => {
    localStorage.setItem('user_info', JSON.stringify(user));
    set({ user });
  },

  logout: async () => {
    try {
      if (get().token) {
        await authApi.logout();
      }
    } catch (err) {
      console.error('Logout error on server:', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  fetchCurrentUser: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    set({ isLoading: true });
    try {
      const res = await authApi.getProfile();
      if (res && res.data) {
        const u = res.data;
        const mappedUser: User = {
          id: u.userId,
          email: u.email,
          fullName: u.fullName,
          roles: u.roles || ['LEARNER'],
        };
        get().setUser(mappedUser);
      }
    } catch (err) {
      console.warn('Could not fetch user profile:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
