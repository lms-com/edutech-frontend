import axios from 'axios';
import { getDeviceFingerprint } from '../utils/fingerprint';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Request Interceptor: Luôn gắn Token và Device Fingerprint
axiosClient.interceptors.request.use(
  async (config) => {
    // Gắn Device Fingerprint cho Gateway kiểm tra Redis session
    const fingerprint = await getDeviceFingerprint();
    if (fingerprint) {
      config.headers['X-Device-Fingerprint'] = fingerprint;
    }

    // Gắn Bearer Token nếu có
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Chuẩn hóa dữ liệu và bắt lỗi tập trung
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Phiên đăng nhập hết hạn hoặc bị kick khỏi thiết bị.');
      localStorage.removeItem('access_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default axiosClient;
