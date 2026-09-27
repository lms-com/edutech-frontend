import axios from 'axios';
import { getDeviceFingerprint } from '../utils/fingerprint';
import { API_BASE_URL } from './config';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
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
      // Token sai hoặc hết hạn. Không điều hướng cứng ở đây: app không có router
      // nên chuyển trang sẽ nạp lại toàn bộ ứng dụng và làm mất state đang thao tác.
      console.warn('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default axiosClient;
