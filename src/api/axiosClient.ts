import axios, { type AxiosRequestConfig } from 'axios';
import { getDeviceFingerprint } from '../utils/fingerprint';
import { API_BASE_URL } from './config';

const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Request Interceptor: Luôn gắn Token và Device Fingerprint
instance.interceptors.request.use(
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
instance.interceptors.response.use(
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

/**
 * Hình dạng thực tế của client sau interceptor.
 *
 * Response interceptor ở trên trả về `response.data`, nhưng kiểu gốc của axios
 * vẫn khai báo `get<T>()` trả về `AxiosResponse<T>`. Vì vậy `get<ApiEnvelope<T>>`
 * được hiểu là "AxiosResponse chứa ApiEnvelope" — sai với thực tế, và trước đây
 * mọi chỗ gọi phải lách bằng `const res: any`.
 *
 * Khai báo tường minh ở đây để chỉ có MỘT chỗ mô tả hành vi đó, và các hàm gọi API
 * nhận đúng kiểu dữ liệu đã bóc vỏ.
 */
export interface HttpClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

const axiosClient = instance as unknown as HttpClient;

export default axiosClient;
