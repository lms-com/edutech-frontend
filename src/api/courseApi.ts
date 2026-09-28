import axiosClient from './axiosClient';
import { unwrap, unwrapPage, type ApiEnvelope, type PageDto, type PageResult } from './response';
import {
  mapCategory,
  mapCourse,
  mapCourseDetail,
  mapQuestions,
  type CategoryResponseDto,
  type CourseDetailResponseDto,
  type CourseResponseDto,
  type QuestionResponseDto,
} from './mappers/courseMapper';
import type { Course, QuizQuestion } from '../types';

const COURSE_BASE = '/course-service/api/v1';

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  orderIndex?: number;
}

export interface CourseFilterParams {
  page?: number;
  size?: number;
  sort?: string;
}

/** Danh sách danh mục thật từ DB (seed: Lập trình, Thiết kế, Java, Web Development). */
const getCategories = async (): Promise<CategoryDto[]> => {
  const res = await axiosClient.get<ApiEnvelope<CategoryResponseDto[]>>(`${COURSE_BASE}/categories`);
  return unwrap(res).map(mapCategory);
};

const getCourses = async (params?: CourseFilterParams): Promise<PageResult<Course>> => {
  const res = await axiosClient.get<ApiEnvelope<PageDto<CourseResponseDto>>>(`${COURSE_BASE}/courses`, { params });
  const page = unwrapPage(res);
  return { ...page, items: page.items.map(mapCourse) };
};

/**
 * Danh mục dành cho khách/học viên: chỉ khóa đã xuất bản.
 *
 * Lọc ở đây vì `GET /courses` phía backend chỉ lọc `is_deleted`, không lọc
 * `status` — nếu không lọc, khóa PENDING/REJECTED sẽ hiện ra ngoài trang chủ.
 * Đúng ra backend nên có tham số status cho endpoint công khai.
 */
const getCatalogCourses = async (params?: CourseFilterParams): Promise<PageResult<Course>> => {
  const page = await getCourses(params);
  const items = page.items.filter(course => course.status.toUpperCase() === 'PUBLISHED');
  return { ...page, items, totalElements: items.length };
};

const getQuizQuestions = async (lessonId: string): Promise<QuizQuestion[]> => {
  const res = await axiosClient.get<ApiEnvelope<QuestionResponseDto[]>>(
    `${COURSE_BASE}/lessons/${lessonId}/questions`,
    // isLearner=true để backend ẩn đáp án đúng; việc chấm điểm do server thực hiện.
    { params: { isLearner: true } },
  );
  return mapQuestions(unwrap(res));
};

const getCourseById = async (courseId: string): Promise<Course> => {
  const res = await axiosClient.get<ApiEnvelope<CourseDetailResponseDto>>(`${COURSE_BASE}/courses/${courseId}`);
  const detail = unwrap(res);

  // Câu hỏi của bài kiểm tra nằm ở endpoint riêng, phải gọi thêm cho từng quiz.
  const quizLessonIds = (detail.sections ?? [])
    .flatMap(section => section.lessons ?? [])
    .filter(lesson => (lesson.type ?? '').toUpperCase() === 'QUIZ')
    .map(lesson => lesson.id);

  const questionsByLesson: Record<string, QuizQuestion[]> = {};
  await Promise.all(
    quizLessonIds.map(async lessonId => {
      try {
        questionsByLesson[lessonId] = await getQuizQuestions(lessonId);
      } catch (err) {
        // Không tải được câu hỏi thì vẫn hiển thị được chương/bài, chỉ mất phần quiz.
        console.warn(`Không tải được câu hỏi cho bài kiểm tra ${lessonId}:`, err);
        questionsByLesson[lessonId] = [];
      }
    }),
  );

  return mapCourseDetail(detail, questionsByLesson);
};

const getRelatedCourses = async (courseId: string): Promise<Course[]> => {
  const res = await axiosClient.get<ApiEnvelope<CourseResponseDto[]>>(`${COURSE_BASE}/courses/${courseId}/related`);
  return unwrap(res).map(mapCourse);
};

export const courseApi = {
  getCategories,
  getCourses,
  getCatalogCourses,
  getCourseById,
  getQuizQuestions,
  getRelatedCourses,
};

export default courseApi;
