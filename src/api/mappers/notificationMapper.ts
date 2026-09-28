/**
 * Chuyển DTO thông báo và chứng chỉ của backend sang mô hình hiển thị.
 *
 * Cùng mục đích với courseMapper: giao diện không đọc trực tiếp tên trường backend,
 * và trường nào backend không có thì trả rỗng để giao diện ẩn đi.
 */
import type { Certificate, NotificationItem } from '../../types';
import { formatDate } from '../../utils/format';

export interface NotificationResponseDto {
  id: string;
  /** ORDER_COMPLETED | COURSE_APPROVED | COURSE_REJECTED | COURSE_COMPLETED | OTP_SENT */
  type?: string;
  title: string;
  content?: string;
  isRead?: boolean;
  readAt?: string;
  referenceId?: string;
  referenceType?: string;
  createdAt?: string;
}

export interface CertificateResponseDto {
  id: string;
  learnerId: string;
  courseId: string;
  enrollmentId?: string;
  qrCodeHash: string;
  pdfUrl?: string;
  issuedAt?: string;
}

/** Thời gian tương đối cho dễ đọc; backend trả ISO nên phải đổi. */
const relativeTime = (iso?: string): string => {
  if (!iso) return '';
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return '';

  const diffMinutes = Math.round((Date.now() - created.getTime()) / 60000);
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffMinutes < 60 * 24) return `${Math.round(diffMinutes / 60)} giờ trước`;
  if (diffMinutes < 60 * 24 * 7) return `${Math.round(diffMinutes / (60 * 24))} ngày trước`;
  return formatDate(iso);
};

export const mapNotification = (dto: NotificationResponseDto): NotificationItem => ({
  id: dto.id,
  title: dto.title,
  message: dto.content ?? '',
  type: dto.type ?? '',
  timestamp: relativeTime(dto.createdAt),
  isRead: dto.isRead ?? false,
  link: dto.referenceId,
});

/**
 * Chứng chỉ của backend chỉ trả về ID (khóa học, học viên) chứ không trả tên.
 * Truyền thêm ngữ cảnh đã có sẵn ở giao diện để hiển thị, thiếu thì để rỗng.
 */
export const mapCertificate = (
  dto: CertificateResponseDto,
  context: { courseTitle?: string; studentName?: string; studentEmail?: string } = {},
): Certificate => ({
  id: dto.id,
  courseId: dto.courseId,
  courseTitle: context.courseTitle ?? '',
  studentName: context.studentName ?? '',
  studentEmail: context.studentEmail ?? '',
  issueDate: formatDate(dto.issuedAt),
  qrCodeHash: dto.qrCodeHash,
  pdfUrl: dto.pdfUrl ?? '',
  instructorName: '',
  directorName: '',
  grade: '',
});
