import axiosClient from './axiosClient';

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  orderIndex?: number;
}

export interface CourseFilterParams {
  page?: number;
  size?: number;
  categoryId?: string;
  level?: string;
  keyword?: string;
  sort?: string;
}

export const courseApi = {
  // 1. Lấy danh sách danh mục khóa học
  getCategories: async (): Promise<CategoryDto[]> => {
    const res: any = await axiosClient.get('/course-service/api/v1/categories');
    return res?.data || res || [];
  },

  // 2. Lấy danh sách khóa học (hỗ trợ phân trang, lọc, sắp xếp)
  getCourses: async (params?: CourseFilterParams) => {
    const res: any = await axiosClient.get('/course-service/api/v1/courses', { params });
    return res?.data || res;
  },

  // 3. Lấy thông tin chi tiết một khóa học
  getCourseById: async (courseId: string) => {
    const res: any = await axiosClient.get(`/course-service/api/v1/courses/${courseId}`);
    return res?.data || res;
  },

  // 4. Lấy danh sách khóa học liên quan
  getRelatedCourses: async (courseId: string) => {
    const res: any = await axiosClient.get(`/course-service/api/v1/courses/${courseId}/related`);
    return res?.data || res;
  },
};

export default courseApi;
