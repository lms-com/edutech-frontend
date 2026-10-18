import axiosClient from './axiosClient';
import { unwrap, type ApiEnvelope } from './response';

export interface LessonAttachmentItem {
  id: string;
  lessonId: string;
  name: string;
  fileUrl: string;
  fileSize?: string;
  fileType?: string;
  createdAt?: string;
}

export interface CreateAttachmentPayload {
  name: string;
  fileUrl: string;
  fileSize?: string;
  fileType?: string;
}

export const lessonAttachmentApi = {
  /**
   * Lấy danh sách tài liệu đính kèm của một bài học
   */
  getAttachments: async (lessonId: string): Promise<LessonAttachmentItem[]> => {
    const res = await axiosClient.get<ApiEnvelope<LessonAttachmentItem[]>>(
      `/course-service/api/v1/lessons/${lessonId}/attachments`
    );
    return unwrap(res) || [];
  },

  /**
   * Giảng viên thêm tài liệu đính kèm vào bài học
   */
  addAttachment: async (lessonId: string, payload: CreateAttachmentPayload): Promise<LessonAttachmentItem> => {
    const res = await axiosClient.post<ApiEnvelope<LessonAttachmentItem>>(
      `/course-service/api/v1/lessons/${lessonId}/attachments`,
      payload
    );
    return unwrap(res);
  },

  /**
   * Giảng viên xóa tài liệu đính kèm
   */
  deleteAttachment: async (attachmentId: string): Promise<void> => {
    await axiosClient.delete(`/course-service/api/v1/lessons/attachments/${attachmentId}`);
  },
};
