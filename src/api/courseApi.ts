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

export interface CreateCoursePayload {
  title: string;
  slug: string;
  categoryId: string;
  description?: string;
  thumbnailUrl?: string;
  level?: string;
  basePrice: number;
  currencyCode?: string;
}

export interface UpdateCoursePayload {
  title?: string;
  slug?: string;
  categoryId?: string;
  description?: string;
  thumbnailUrl?: string;
  level?: string;
  basePrice?: number;
  currencyCode?: string;
}

export interface CreateSectionPayload {
  courseId: string;
  title: string;
  orderIndex?: number;
}

export interface CreateLessonPayload {
  title: string;
  type: string;
  orderIndex?: number;
  freePreview?: boolean;
  videoUrl?: string;
  duration?: number;
  passScore?: number;
}

export interface AdminCourseFilterParams extends CourseFilterParams {
  status?: string;
  instructorId?: string;
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

const getMyCourses = async (params?: CourseFilterParams): Promise<PageResult<Course>> => {
  const res = await axiosClient.get<ApiEnvelope<PageDto<CourseResponseDto>>>(
    `${COURSE_BASE}/courses/my-courses`, { params },
  );
  const page = unwrapPage(res);
  return { ...page, items: page.items.map(mapCourse) };
};

const createCourse = async (payload: CreateCoursePayload): Promise<Course> => {
  const res = await axiosClient.post<ApiEnvelope<CourseResponseDto>>(`${COURSE_BASE}/courses`, payload);
  return mapCourse(unwrap(res));
};

const updateCourse = async (courseId: string, payload: UpdateCoursePayload): Promise<Course> => {
  const res = await axiosClient.patch<ApiEnvelope<CourseResponseDto>>(`${COURSE_BASE}/courses/${courseId}`, payload);
  return mapCourse(unwrap(res));
};

const changeCourseStatus = async (courseId: string, status: string): Promise<void> => {
  const res = await axiosClient.put<ApiEnvelope<unknown>>(`${COURSE_BASE}/courses/${courseId}/status`, { status });
  if (typeof res?.code === 'number' && res.code !== 200) throw new Error(res.message || 'Không đổi được trạng thái khóa học.');
};

const createSection = async (payload: CreateSectionPayload): Promise<void> => {
  const res = await axiosClient.post<ApiEnvelope<unknown>>(`${COURSE_BASE}/sections`, payload);
  if (typeof res?.code === 'number' && res.code !== 200) throw new Error(res.message || 'Không tạo được chương học.');
};

const updateSection = async (sectionId: string, payload: { title: string; orderIndex?: number }): Promise<void> => {
  const res = await axiosClient.put<ApiEnvelope<unknown>>(`${COURSE_BASE}/sections/${sectionId}`, payload);
  if (typeof res?.code === 'number' && res.code !== 200) throw new Error(res.message || 'Không cập nhật được chương học.');
};

const deleteSection = async (sectionId: string): Promise<void> => {
  const res = await axiosClient.delete<ApiEnvelope<unknown>>(`${COURSE_BASE}/sections/${sectionId}`);
  if (typeof res?.code === 'number' && res.code !== 200) throw new Error(res.message || 'Không xóa được chương học.');
};

const createLesson = async (sectionId: string, payload: CreateLessonPayload): Promise<void> => {
  const res = await axiosClient.post<ApiEnvelope<unknown>>(`${COURSE_BASE}/sections/${sectionId}/lessons`, payload);
  if (typeof res?.code === 'number' && res.code !== 200) throw new Error(res.message || 'Không tạo được bài học.');
};

const deleteLesson = async (lessonId: string): Promise<void> => {
  const res = await axiosClient.delete<ApiEnvelope<unknown>>(`${COURSE_BASE}/lessons/${lessonId}`);
  if (typeof res?.code === 'number' && res.code !== 200) throw new Error(res.message || 'Không xóa được bài học.');
};

const getAdminCourses = async (params?: AdminCourseFilterParams): Promise<PageResult<Course>> => {
  const res = await axiosClient.get<ApiEnvelope<PageDto<CourseResponseDto>>>(
    `${COURSE_BASE}/admin/courses`, { params },
  );
  const page = unwrapPage(res);
  return { ...page, items: page.items.map(mapCourse) };
};

const approveCourse = async (courseId: string): Promise<void> => {
  const res = await axiosClient.put<ApiEnvelope<unknown>>(`${COURSE_BASE}/admin/courses/${courseId}/approve`);
  if (typeof res?.code === 'number' && res.code !== 200) throw new Error(res.message || 'Không duyệt được khóa học.');
};

const rejectCourse = async (courseId: string, rejectionNote: string): Promise<void> => {
  const res = await axiosClient.put<ApiEnvelope<unknown>>(
    `${COURSE_BASE}/admin/courses/${courseId}/reject`, { rejectionNote },
  );
  if (typeof res?.code === 'number' && res.code !== 200) throw new Error(res.message || 'Không từ chối được khóa học.');
};

/**
 * Danh mục dành cho khách/học viên: chỉ khóa đã xuất bản.
 */
const getCatalogCourses = async (params?: CourseFilterParams): Promise<PageResult<Course>> => {
  const page = await getCourses(params);
  const items = page.items.filter(course => course.status.toUpperCase() === 'PUBLISHED');
  return { ...page, items, totalElements: items.length };
};

const getQuizQuestions = async (lessonId: string): Promise<QuizQuestion[]> => {
  const res = await axiosClient.get<ApiEnvelope<QuestionResponseDto[]>>(
    `${COURSE_BASE}/lessons/${lessonId}/questions`,
    { params: { isLearner: true } },
  );
  return mapQuestions(unwrap(res));
};

const getCourseById = async (courseId: string): Promise<Course> => {
  const res = await axiosClient.get<ApiEnvelope<CourseDetailResponseDto>>(`${COURSE_BASE}/courses/${courseId}`);
  const detail = unwrap(res);

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

const getLessonPlayUrl = async (lessonId: string): Promise<string> => {
  const res = await axiosClient.get<ApiEnvelope<string>>(`${COURSE_BASE}/lessons/${lessonId}/play`);
  return unwrap(res);
};

export const courseApi = {
  getCategories,
  getCourses,
  getMyCourses,
  createCourse,
  updateCourse,
  changeCourseStatus,
  createSection,
  updateSection,
  deleteSection,
  createLesson,
  deleteLesson,
  getAdminCourses,
  approveCourse,
  rejectCourse,
  getCatalogCourses,
  getCourseById,
  getQuizQuestions,
  getRelatedCourses,
  getLessonPlayUrl,
};

export default courseApi;
