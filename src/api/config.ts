/**
 * Địa chỉ API Gateway — nguồn duy nhất cho toàn bộ tầng API.
 *
 * Đặt tại đây thay vì khai báo rải rác trong từng file để tránh lệch cổng:
 * axios và SSE (EventSource) bắt buộc phải trỏ cùng một Gateway.
 * Ghi đè khi triển khai bằng biến môi trường VITE_API_BASE_URL.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
