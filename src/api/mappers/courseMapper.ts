/**
 * Chuyển DTO của backend thành mô hình mà giao diện hiểu.
 *
 * Đây là "lớp chống tham nhũng" (anti-corruption layer): giao diện không đọc
 * trực tiếp tên trường của backend, và backend không phải bẻ cong API theo nhu
 * cầu hiển thị. Nhờ vậy đổi một bên chỉ phải sửa ở đúng file này.
 *
 * Quy ước: trường nào backend KHÔNG cung cấp thì trả về giá trị rỗng ('' / 0 /
 * []) và giao diện tự ẩn khối tương ứng. Không bịa giá trị để trông đẹp.
 */
import type {
  Course,
  CourseSection,
  InstructorProfile,
  Lesson,
  Quiz,
  QuizQuestion,
  ReviewItem,
} from '../../types';
import { formatDate } from '../../utils/format';

// ============================ DTO từ backend ============================

export interface CourseResponseDto {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  level?: string;
  instructorId?: string;
  categoryId?: string;
  categoryName?: string;
  basePrice?: number;
  currencyCode?: string;
  status?: string;
  rejectionNote?: string;
  overrideCommissionRate?: number;
}

export interface LessonResponseDto {
  id: string;
  title: string;
  /** VIDEO hoặc QUIZ */
  type?: string;
  orderIndex?: number;
  freePreview?: boolean;
  videoUrl?: string;
  /** Thời lượng tính bằng GIÂY (seed dùng 600, 1200). */
  duration?: number;
  passScore?: number;
}

export interface SectionResponseDto {
  id: string;
  courseId?: string;
  title: string;
  orderIndex?: number;
  lessons?: LessonResponseDto[];
}

export interface CourseDetailResponseDto extends CourseResponseDto {
  sections?: SectionResponseDto[];
}

export interface CategoryResponseDto {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  orderIndex?: number;
}

export interface ReviewResponseDto {
  id: string;
  enrollmentId?: string;
  courseId?: string;
  learnerId?: string;
  star?: number;
  comment?: string;
  createdAt?: string;
}

export interface AnswerResponseDto {
  id: string;
  optionText: string;
  /** Backend bỏ trường này khi trả cho học viên. */
  isCorrect?: boolean;
}

export interface QuestionResponseDto {
  id: string;
  questionText: string;
  orderIndex?: number;
  answers?: AnswerResponseDto[];
}

// ============================ Nhãn hiển thị ============================

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

/** Dịch enum trình độ sang nhãn tiếng Việt; giá trị lạ thì giữ nguyên để thấy ngay. */
export const mapLevel = (level?: string): string => {
  const key = (level ?? '').toUpperCase();
  return LEVEL_LABELS[key] ?? level ?? '';
};

const OPTION_KEYS: QuizQuestion['options'][number]['key'][] = ['A', 'B', 'C', 'D'];

// ============================ Hàm chuyển đổi ============================

/**
 * Backend chưa có API trả tên giảng viên (chỉ có instructorId), nên name để rỗng
 * và giao diện sẽ ẩn dòng "Giảng viên". Muốn hiển thị thì course-service phải
 * làm giàu dữ liệu từ iam-service giống cách enrollment-service đang làm với
 * learnerName.
 */
const mapInstructor = (instructorId?: string): InstructorProfile => ({
  id: instructorId ?? '',
  name: '',
  title: '',
  avatar: '',
  bio: '',
  totalStudents: 0,
  totalCourses: 0,
  rating: 0,
});

export const mapCourse = (dto: CourseResponseDto): Course => ({
  id: dto.id,
  title: dto.title,
  slug: dto.slug ?? '',
  categoryId: dto.categoryId ?? '',
  category: dto.categoryName ?? '',
  subcategory: '',
  thumbnail: dto.thumbnailUrl ?? '',
  trailerVideoUrl: '',
  instructor: mapInstructor(dto.instructorId),
  // Điểm đánh giá và số bài học chưa có trong API danh sách; màn chi tiết tự tính.
  rating: 0,
  reviewsCount: 0,
  price: Number(dto.basePrice ?? 0),
  level: mapLevel(dto.level),
  durationHours: 0,
  totalLessons: 0,
  updatedAt: '',
  language: '',
  shortDescription: dto.description ?? '',
  whatYouWillLearn: [],
  sections: [],
  status: dto.status ?? '',
  rejectionNote: dto.rejectionNote,
});

export const mapCategory = (dto: CategoryResponseDto): {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  orderIndex?: number;
} => ({
  id: dto.id,
  name: dto.name,
  slug: dto.slug ?? '',
  parentId: dto.parentId ?? null,
  orderIndex: dto.orderIndex,
});

export const mapLesson = (dto: LessonResponseDto): Lesson => ({  id: dto.id,
  title: dto.title,
  durationMinutes: Math.round((dto.duration ?? 0) / 60),
  videoUrl: dto.videoUrl ?? undefined,
  mediaId: '',
  isHlsEncrypted: false,
  isPreview: dto.freePreview ?? false,
  summary: '',
  resources: [],
});

export const mapQuestions = (dtos: QuestionResponseDto[]): QuizQuestion[] =>
  dtos.map(dto => ({
    id: dto.id,
    question: dto.questionText,
    options: (dto.answers ?? []).map((answer, index) => ({
      key: OPTION_KEYS[index] ?? 'A',
      text: answer.optionText,
      answerId: answer.id,
    })),
    // Học viên không nhận được đáp án đúng; server chấm dựa trên answerId gửi lên.
    explanation: '',
  }));

const mapQuiz = (dto: LessonResponseDto, questions: QuizQuestion[]): Quiz => ({
  id: dto.id,
  title: dto.title,
  durationMinutes: 0,
  passScore: Number(dto.passScore ?? 80),
  questions,
});

/**
 * Tách bài học thành video và bài kiểm tra: backend trả lẫn trong một danh sách
 * (type = VIDEO | QUIZ) còn giao diện mô hình quiz riêng ở cấp chương.
 */
const mapSection = (dto: SectionResponseDto, questionsByLesson: Record<string, QuizQuestion[]>): CourseSection => {
  const lessons = dto.lessons ?? [];
  const videoLessons = lessons.filter(lesson => (lesson.type ?? 'VIDEO').toUpperCase() !== 'QUIZ');
  const quizLesson = lessons.find(lesson => (lesson.type ?? '').toUpperCase() === 'QUIZ');

  return {
    id: dto.id,
    title: dto.title,
    lessons: videoLessons.map(mapLesson),
    quiz: quizLesson ? mapQuiz(quizLesson, questionsByLesson[quizLesson.id] ?? []) : undefined,
  };
};

export const mapCourseDetail = (
  dto: CourseDetailResponseDto,
  questionsByLesson: Record<string, QuizQuestion[]> = {},
): Course => {
  const base = mapCourse(dto);
  const sections = (dto.sections ?? []).map(section => mapSection(section, questionsByLesson));
  const lessons = sections.flatMap(section => section.lessons);
  const totalMinutes =
    lessons.reduce((sum, lesson) => sum + (lesson.durationMinutes || 0), 0) +
    sections.reduce((sum, section) => sum + (section.quiz?.durationMinutes ?? 0), 0);

  return {
    ...base,
    sections,
    // Hai giá trị này tính được từ dữ liệu thật nên hiển thị được
    totalLessons: lessons.length,
    durationHours: Math.round((totalMinutes / 60) * 10) / 10,
  };
};

/**
 * Backend không trả tên người đánh giá (chỉ learnerId). Hiển thị nhãn trung tính
 * thay vì bịa tên; muốn có tên thật thì enrollment-service phải làm giàu qua
 * iam-service, đúng cách nó đang làm cho learnerName của enrollment.
 */
export const mapReview = (dto: ReviewResponseDto): ReviewItem => ({
  id: dto.id,
  userName: 'Học viên',
  userAvatar: '',
  rating: Number(dto.star ?? 0),
  date: formatDate(dto.createdAt),
  comment: dto.comment ?? '',
});

/** Điểm trung bình và số lượt đánh giá, tính từ danh sách đánh giá thật. */
export const summarizeReviews = (reviews: ReviewItem[]): { rating: number; reviewsCount: number } => {
  if (reviews.length === 0) return { rating: 0, reviewsCount: 0 };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    rating: Math.round((total / reviews.length) * 10) / 10,
    reviewsCount: reviews.length,
  };
};
