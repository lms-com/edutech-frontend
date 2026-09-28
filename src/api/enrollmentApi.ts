import axiosClient from './axiosClient';

export interface LessonProgressPayload {
  isCompleted?: boolean;
  lastWatchTimeSeconds?: number;
}

export interface ReviewPayload {
  courseId: string;
  star: number;
  comment: string;
}

export interface QuizSubmitPayload {
  lessonId: string;
  score: number;
  isPassed: boolean;
}

export const enrollmentApi = {
  // 1. Lấy toàn bộ tiến độ học tập của một khóa học
  getCourseProgress: async (courseId: string) => {
    const res: any = await axiosClient.get(`/enrollment-service/api/v1/progress/courses/${courseId}`);
    return res?.data || res;
  },

  // 2. Cập nhật tiến độ học của một bài học (ví dụ: đã xem >= 80%, lưu vị trí xem dở)
  updateLessonProgress: async (lessonId: string, payload: LessonProgressPayload) => {
    const res: any = await axiosClient.put(`/enrollment-service/api/v1/progress/lessons/${lessonId}`, payload);
    return res?.data || res;
  },

  // 3. Lấy danh sách đánh giá của khóa học
  getCourseReviews: async (courseId: string) => {
    const res: any = await axiosClient.get(`/enrollment-service/api/v1/reviews/courses/${courseId}`);
    return res?.data || res;
  },

  // 4. Gửi đánh giá phản hồi khóa học
  submitReview: async (payload: ReviewPayload) => {
    const res: any = await axiosClient.post('/enrollment-service/api/v1/reviews', payload);
    return res?.data || res;
  },

  // 5. Nộp kết quả làm bài trắc nghiệm Quiz
  submitQuizAttempt: async (payload: QuizSubmitPayload) => {
    const res: any = await axiosClient.post('/enrollment-service/api/v1/quiz-attempts', payload);
    return res?.data || res;
  },
};

export default enrollmentApi;
