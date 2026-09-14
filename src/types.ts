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
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
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
  category: string;
  subcategory: string;
  thumbnail: string;
  trailerVideoUrl: string;
  instructor: InstructorProfile;
  rating: number;
  reviewsCount: number;
  price: number;
  discountPrice?: number;
  level: 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
  durationHours: number;
  totalLessons: number;
  updatedAt: string;
  language: string;
  shortDescription: string;
  whatYouWillLearn: string[];
  sections: CourseSection[];
  status: 'PUBLISHED' | 'PENDING' | 'REJECTED';
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
  type: 'PAYMENT' | 'VIDEO_PROCESSED' | 'CERTIFICATE' | 'SYSTEM';
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

export * from './types/auth';
