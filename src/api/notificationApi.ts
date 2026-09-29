import axiosClient from './axiosClient';
import { API_BASE_URL } from './config';
import { unwrap, unwrapPage, type ApiEnvelope, type PageDto, type PageResult } from './response';
import {
  mapCertificate,
  mapNotification,
  type CertificateResponseDto,
  type NotificationResponseDto,
} from './mappers/notificationMapper';
import type { Certificate, NotificationItem } from '../types';

const NOTIFICATION_BASE = '/notification-service/api/v1';

export interface UnreadCountDto {
  unreadCount: number;
}

/** Danh sách thông báo của tôi. Đường dẫn đúng là /notifications/me (không phải /notifications). */
const getNotifications = async (params?: { page?: number; size?: number }): Promise<PageResult<NotificationItem>> => {
  const res = await axiosClient.get<ApiEnvelope<PageDto<NotificationResponseDto>>>(
    `${NOTIFICATION_BASE}/notifications/me`,
    { params: { size: 20, ...params } },
  );
  const page = unwrapPage(res);
  return { ...page, items: page.items.map(mapNotification) };
};

const getUnreadCount = async (): Promise<number> => {
  const res = await axiosClient.get<ApiEnvelope<UnreadCountDto>>(
    `${NOTIFICATION_BASE}/notifications/unread-count`,
  );
  return unwrap(res).unreadCount ?? 0;
};

const markAsRead = async (notificationId: string): Promise<void> => {
  await axiosClient.put<ApiEnvelope<void>>(`${NOTIFICATION_BASE}/notifications/${notificationId}/read`);
};

const markAllAsRead = async (): Promise<void> => {
  await axiosClient.put<ApiEnvelope<void>>(`${NOTIFICATION_BASE}/notifications/read-all`);
};

/** Chứng chỉ của tôi (cần đăng nhập). */
const getMyCertificates = async (): Promise<CertificateResponseDto[]> => {
  const res = await axiosClient.get<ApiEnvelope<CertificateResponseDto[]>>(
    `${NOTIFICATION_BASE}/certificates/me`,
  );
  return unwrap(res);
};

/** Tra cứu chứng chỉ công khai theo mã băm QR (không cần đăng nhập). */
const verifyCertificate = async (
  qrCodeHash: string,
  context?: { courseTitle?: string; studentName?: string; studentEmail?: string },
): Promise<Certificate> => {
  const res = await axiosClient.get<ApiEnvelope<CertificateResponseDto>>(
    `${NOTIFICATION_BASE}/certificates/verify/${encodeURIComponent(qrCodeHash)}`,
  );
  return mapCertificate(unwrap(res), context);
};

/**
 * Đường dẫn SSE cho quả chuông.
 *
 * EventSource không gửi được header Authorization nên backend nhận định danh qua
 * query param userId (không phải token như trước đây — sai tham số nên luôn 400).
 */
const getSseUrl = (userId: string): string =>
  `${API_BASE_URL}${NOTIFICATION_BASE}/notifications/subscribe?userId=${encodeURIComponent(userId)}`;

export const notificationApi = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getMyCertificates,
  verifyCertificate,
  getSseUrl,
};

export default notificationApi;
