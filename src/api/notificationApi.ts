import axiosClient from './axiosClient';

export interface NotificationDto {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

export interface CertificateVerificationDto {
  certificateId: string;
  learnerId: string;
  learnerName?: string;
  courseId: string;
  courseTitle?: string;
  qrCodeHash: string;
  pdfUrl: string;
  issuedAt: string;
  isValid: boolean;
}

export const notificationApi = {
  // 1. Lấy danh sách thông báo của người dùng hiện tại
  getNotifications: async (params?: { page?: number; size?: number }): Promise<NotificationDto[]> => {
    const res: any = await axiosClient.get('/notification-service/api/v1/notifications', { params });
    return res?.data || res || [];
  },

  // 2. Đếm số thông báo chưa đọc (hiển thị quả chuông)
  getUnreadCount: async (): Promise<number> => {
    const res: any = await axiosClient.get('/notification-service/api/v1/notifications/unread-count');
    return res?.data?.unreadCount ?? res?.unreadCount ?? 0;
  },

  // 3. Đánh dấu một thông báo đã đọc
  markAsRead: async (notificationId: string) => {
    const res: any = await axiosClient.put(`/notification-service/api/v1/notifications/${notificationId}/read`);
    return res?.data || res;
  },

  // 4. Đánh dấu tất cả thông báo đã đọc
  markAllAsRead: async () => {
    const res: any = await axiosClient.put('/notification-service/api/v1/notifications/read-all');
    return res?.data || res;
  },

  // 5. Xác thực chứng chỉ công khai qua mã hash QR Code
  verifyCertificate: async (qrCodeHash: string): Promise<CertificateVerificationDto> => {
    const res: any = await axiosClient.get(`/notification-service/api/v1/certificates/verify/${qrCodeHash}`);
    return res?.data || res;
  },

  // 6. Lấy đường dẫn kết nối SSE Realtime cho quả chuông
  getSseUrl: () => {
    const token = localStorage.getItem('access_token');
    return `http://localhost:8080/notification-service/api/v1/notifications/subscribe${token ? `?token=${token}` : ''}`;
  },
};

export default notificationApi;
