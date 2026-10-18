import { create } from 'zustand';
import type { User } from '../types/auth';
import { authApi } from '../api/authApi';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<User | null>;
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

  // Lưu token ngay sau khi đăng nhập, trước khi gọi /user/me lấy hồ sơ đầy đủ
  setToken: (token) => {
    localStorage.setItem('access_token', token);
    set({ token });
  },

  setUser: (user) => {
    localStorage.setItem('user_info', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    set({ user: null, token: null, isAuthenticated: false });
  },

  logout: async () => {
    const currentToken = get().token;
    // 1. Dọn sạch phiên cục bộ ngay lập tức để giao diện phản hồi tức thì
    get().clearAuth();

    // 2. Tắt chế độ tự động đăng nhập của Google Identity Services
    try {
      if ((window as any).google?.accounts?.id?.disableAutoSelect) {
        (window as any).google.accounts.id.disableAutoSelect();
      }
    } catch (e) {
      console.warn('Lỗi khi tắt Google auto-select:', e);
    }

    // 3. Thông báo thu hồi token và session phía backend
    if (currentToken) {
      try {
        await authApi.logout();
      } catch (err) {
        console.warn('Không thể thu hồi phiên phía máy chủ:', err);
      }
    }
  },

  /**
   * Lấy hồ sơ thật từ IAM (/user/me) để có fullName và roles chuẩn.
   * Không lấy được thì xoá phiên luôn, tránh trạng thái đăng nhập nửa vời.
   */
  fetchCurrentUser: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    set({ isLoading: true });
    try {
      const res = await authApi.getProfile();
      if (res?.data) {
        const profile = res.data;
        const mappedUser: User = {
          id: profile.userId,
          email: profile.email,
          fullName: profile.fullName,
          roles: profile.roles ?? [],
        };
        get().setUser(mappedUser);
        return mappedUser;
      }
      get().clearAuth();
      return null;
    } catch (err) {
      console.warn('Không lấy được hồ sơ người dùng, xoá phiên đăng nhập:', err);
      get().clearAuth();
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Token hết hạn giữa phiên: axiosClient bắn sự kiện, store xoá phiên.
// Dùng sự kiện thay vì import trực tiếp để tránh vòng lặp import
// store -> authApi -> axiosClient -> store.
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().clearAuth();
  });
}
