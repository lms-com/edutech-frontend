import axiosClient from './axiosClient';
import { unwrap, unwrapPage, type ApiEnvelope, type PageDto, type PageResult } from './response';
import { mapReview, mapRatingSummary, type ReviewResponseDto, type RatingSummaryResponseDto } from './mappers/courseMapper';
import type { ReviewItem, RatingSummary, QuizQuestionResult } from '../types';

const ENROLLMENT_BASE = '/enrollment-service/api/v1';

// ============================ DTO từ backend ============================

export interface EnrollmentDto {
  id: string;
  courseId: string;
  learnerId: string;
  learnerName?: string | null;
  learnerAvatar?: string | null;
  status?: string;
  startedAt?: string;
  completedRate?: number;
}

export interface LessonProgressDto {
  id?: string | null;
  enrollmentId?: string;
  lessonId: string;
  isCompleted: boolean;
  lastWatchTimeSeconds?: number;
}

export interface QuizQuestionResultDto {
  questionId: string;
  questionText?: string;
  selectedAnswerId?: string | null;
  correctAnswerIds?: string[];
  isCorrect?: boolean;
  explanation?: string | null;
}

export interface QuizResultDto {
  lessonId: string;
  score: number;
  passScore?: number;
  isPassed: boolean;
  feedback?: string;
  details?: QuizQuestionResult[];
}

export interface QuizAttemptDto {
  id: string;
  enrollmentId: string;
  lessonId: string;
  score: number;
  isPassed: boolean;
  submittedAt?: string;
}

/** Lựa chọn của học viên cho một câu hỏi. Server đối chiếu với đáp án đúng để chấm. */
export interface QuizAnswerPayload {
  questionId: string;
  answerId: string;
}

// ============================ Hàm gọi API ============================

const getMyEnrollments = async (params?: { page?: number; size?: number }): Promise<PageResult<EnrollmentDto>> => {
  const res = await axiosClient.get<ApiEnvelope<PageDto<EnrollmentDto>>>(`${ENROLLMENT_BASE}/enrollments/my`, {
    params: { size: 100, ...params },
  });
  return unwrapPage(res);
};

/** Ghi danh khóa học miễn phí. Backend phải từ chối nếu khóa học có phí. */
const enrollInFreeCourse = async (courseId: string): Promise<EnrollmentDto> => {
  const res = await axiosClient.post<ApiEnvelope<EnrollmentDto>>(
    `${ENROLLMENT_BASE}/enrollments/courses/${courseId}`,
  );
  return unwrap(res);
};

/** Lượt ghi danh của tôi cho một khóa học, null nếu chưa ghi danh. */
const findMyEnrollmentForCourse = async (courseId: string): Promise<EnrollmentDto | null> => {
  const page = await getMyEnrollments();
  return page.items.find(enrollment => enrollment.courseId === courseId) ?? null;
};

const getEnrollmentProgress = async (enrollmentId: string): Promise<LessonProgressDto[]> => {
  const res = await axiosClient.get<ApiEnvelope<LessonProgressDto[]>>(
    `${ENROLLMENT_BASE}/progress/enrollments/${enrollmentId}`,
  );
  return unwrap(res);
};

const updateLessonProgress = async (
  enrollmentId: string,
  lessonId: string,
  payload: { isCompleted: boolean; lastWatchTimeSeconds?: number },
): Promise<LessonProgressDto> => {
  const res = await axiosClient.put<ApiEnvelope<LessonProgressDto>>(
    `${ENROLLMENT_BASE}/progress/enrollments/${enrollmentId}/lessons/${lessonId}`,
    payload,
  );
  return unwrap(res);
};

const getCourseReviews = async (
  courseId: string,
  params?: { page?: number; size?: number },
): Promise<PageResult<ReviewItem>> => {
  const res = await axiosClient.get<ApiEnvelope<PageDto<ReviewResponseDto>>>(
    `${ENROLLMENT_BASE}/reviews/courses/${courseId}`,
    { params: { size: 50, ...params } },
  );
  const page = unwrapPage(res);
  return { ...page, items: page.items.map(mapReview) };
};

const getCourseRatingSummary = async (courseId: string): Promise<RatingSummary> => {
  const res = await axiosClient.get<ApiEnvelope<RatingSummaryResponseDto>>(
    `${ENROLLMENT_BASE}/reviews/courses/${courseId}/summary`,
  );
  return mapRatingSummary(unwrap(res), courseId);
};

/** Gửi đánh giá. courseId nằm trên đường dẫn, body chỉ có star và comment. */
const submitReview = async (
  courseId: string,
  payload: { star: number; comment: string },
): Promise<ReviewItem> => {
  const res = await axiosClient.post<ApiEnvelope<ReviewResponseDto>>(
    `${ENROLLMENT_BASE}/reviews/courses/${courseId}`,
    payload,
  );
  return mapReview(unwrap(res));
};

/**
 * Nộp bài kiểm tra: gửi các lựa chọn, KHÔNG gửi điểm.
 * Điểm do backend chấm từ đáp án đúng nên không thể sửa từ phía client.
 */
const submitQuizAttempt = async (
  enrollmentId: string,
  quizId: string,
  answers: QuizAnswerPayload[],
): Promise<QuizResultDto> => {
  const res = await axiosClient.post<ApiEnvelope<QuizResultDto & { details?: QuizQuestionResultDto[] }>>(
    `${ENROLLMENT_BASE}/quiz-attempts/enrollments/${enrollmentId}/quizzes/${quizId}`,
    { answers },
  );
  const raw = unwrap(res);
  return {
    lessonId: raw.lessonId,
    score: Number(raw.score ?? 0),
    passScore: raw.passScore !== undefined ? Number(raw.passScore) : undefined,
    isPassed: Boolean(raw.isPassed),
    feedback: raw.feedback,
    details: (raw.details ?? []).map(d => ({
      questionId: d.questionId,
      questionText: d.questionText ?? '',
      selectedAnswerId: d.selectedAnswerId ?? null,
      correctAnswerIds: d.correctAnswerIds ?? [],
      isCorrect: Boolean(d.isCorrect),
      explanation: d.explanation ?? '',
    })),
  };
};

const getQuizAttempts = async (enrollmentId: string, quizId: string): Promise<QuizAttemptDto[]> => {
  const res = await axiosClient.get<ApiEnvelope<QuizAttemptDto[]>>(
    `${ENROLLMENT_BASE}/quiz-attempts/enrollments/${enrollmentId}/quizzes/${quizId}`,
  );
  return unwrap(res);
};

export const enrollmentApi = {
  getMyEnrollments,
  enrollInFreeCourse,
  findMyEnrollmentForCourse,
  getEnrollmentProgress,
  updateLessonProgress,
  getCourseReviews,
  getCourseRatingSummary,
  submitReview,
  submitQuizAttempt,
  getQuizAttempts,
};

export default enrollmentApi;
