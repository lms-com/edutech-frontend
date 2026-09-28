export type PortalType = 'learner' | 'instructor' | 'admin' | 'public_verify';

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  videoUrl?: string;
  mediaId: string;
  isHlsEncrypted: boolean;
  isPreview: boolean;
  summary: string;
  resources: { name: string; size: string; type: string; url: string }[];
  isCompleted?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string; answerId?: string }[];
  /** Backend ẩn đáp án đúng với học viên; điểm do server chấm từ answerId đã chọn. */
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  durationMinutes: number;
  passScore: number; // e.g. 80%
  questions: QuizQuestion[];
  isCompleted?: boolean;
  score?: number;
}

export interface CourseSection {
  id: string;
  title: string;
  lessons: Lesson[];
  quiz?: Quiz;
}

export interface InstructorProfile {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  totalStudents: number;
  totalCourses: number;
  rating: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  categoryId?: string;
  category: string;
  subcategory: string;
  thumbnail: string;
  trailerVideoUrl: string;
  instructor: InstructorProfile;
  rating: number;
  reviewsCount: number;
  price: number;
  discountPrice?: number;
  /**
   * Backend trả enum tiếng Anh (BEGINNER/INTERMEDIATE/ADVANCED) nên không thể khai
   * báo là union tiếng Việt. Bộ chuyển đổi ở src/api/mappers dịch sang nhãn hiển thị.
   */
  level: string;
  durationHours: number;
  totalLessons: number;
  updatedAt: string;
  language: string;
  shortDescription: string;
  whatYouWillLearn: string[];
  sections: CourseSection[];
  /** PUBLISHED / PENDING / DRAFT / REJECTED tuỳ enum phía backend. */
  status: string;
  rejectionNote?: string;
}

export interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  studentEmail: string;
  issueDate: string;
  qrCodeHash: string;
  pdfUrl: string;
  instructorName: string;
  directorName: string;
  grade: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  /**
   * Phản chiếu enum NotificationType của backend:
   * ORDER_COMPLETED | COURSE_APPROVED | COURSE_REJECTED | COURSE_COMPLETED | OTP_SENT
   */
  type: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export interface DeviceSession {
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  browser: string;
  os: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface PayoutRequest {
  id: string;
  instructorId: string;
  instructorName: string;
  amount: number;
  bankName: string;
  bankAccount: string;
  bankOwner: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
}

export interface ReviewItem {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  comment: string;
}

export interface VNPayPaymentResult {
  isSuccess: boolean;
  responseCode: string;
  orderId?: string;
  amount?: number;
  bankCode?: string;
  transactionNo?: string;
  cardType?: string;
  payDate?: string;
  orderInfo?: string;
  message: string;
}

export * from './types/auth';
