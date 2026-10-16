import axiosClient from './axiosClient';
import { unwrap, unwrapPage, type ApiEnvelope, type PageDto, type PageResult } from './response';

export interface LessonCommentItem {
  id: string;
  lessonId: string;
  courseId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  parentId?: string | null;
  content: string;
  likesCount: number;
  createdAt: string;
  updatedAt?: string;
  replies?: LessonCommentItem[];
}

export interface CreateCommentPayload {
  content: string;
  parentId?: string | null;
}

const BASE = '/enrollment-service/api/v1/comments';

export const commentApi = {
  /**
   * Lấy danh sách bình luận / câu hỏi của bài học (kèm replies lồng nhau)
   */
  getCommentsByLesson: async (
    lessonId: string,
    params?: { page?: number; size?: number }
  ): Promise<PageResult<LessonCommentItem>> => {
    const res = await axiosClient.get<ApiEnvelope<PageDto<LessonCommentItem>>>(
      `${BASE}/lessons/${lessonId}`,
      { params: { page: params?.page ?? 0, size: params?.size ?? 50 } }
    );
    return unwrapPage(res);
  },

  /**
   * Gửi bình luận hoặc câu hỏi mới cho bài học
   */
  createComment: async (
    courseId: string,
    lessonId: string,
    payload: CreateCommentPayload
  ): Promise<LessonCommentItem> => {
    const res = await axiosClient.post<ApiEnvelope<LessonCommentItem>>(
      `${BASE}/courses/${courseId}/lessons/${lessonId}`,
      payload
    );
    return unwrap(res);
  },

  /**
   * Xóa bình luận
   */
  deleteComment: async (commentId: string): Promise<void> => {
    await axiosClient.delete(`${BASE}/${commentId}`);
  },

  /**
   * Thả tim / Thích bình luận
   */
  likeComment: async (commentId: string): Promise<LessonCommentItem> => {
    const res = await axiosClient.post<ApiEnvelope<LessonCommentItem>>(
      `${BASE}/${commentId}/like`
    );
    return unwrap(res);
  },
};

export default commentApi;
