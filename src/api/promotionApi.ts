import axiosClient from './axiosClient';
import { unwrap, unwrapPage, type ApiEnvelope, type PageDto, type PageResult } from './response';

// ============================ DTOs ============================

export interface PromotionDto {
  id: string;
  code: string;
  discountPercent?: number | null;
  discountAmount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  usageCount?: number;
  isActive: boolean;
  appliedCourseIds?: string[];
}

export interface CreatePromotionPayload {
  code: string;
  discountPercent?: number | null;
  discountAmount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
}

export interface PromotionValidateResult {
  valid: boolean;
  code: string;
  message: string;
  discountPercent?: number | null;
  discountAmount?: number | null;  // Số tiền thực tế được giảm
  originalPrice?: number | null;
  finalPrice?: number | null;
}

// ============================ API ============================

const BASE = '/order-service/api/v1/promotions';

export const promotionApi = {

  /** Học viên kiểm tra mã giảm giá trước khi đặt hàng */
  validateCode: async (
    code: string,
    courseId: string,
    coursePrice: number,
  ): Promise<PromotionValidateResult> => {
    const res = await axiosClient.get<ApiEnvelope<PromotionValidateResult>>(
      `${BASE}/validate`,
      { params: { code, courseId, coursePrice } },
    );
    return unwrap(res);
  },

  /** Giảng viên: lấy danh sách mã giảm giá của mình */
  getMyPromotions: async (params?: { page?: number; size?: number }): Promise<PageResult<PromotionDto>> => {
    const res = await axiosClient.get<ApiEnvelope<PageDto<PromotionDto>>>(
      `${BASE}/my`,
      { params: { page: params?.page ?? 0, size: params?.size ?? 20 } },
    );
    return unwrapPage(res);
  },

  /** Giảng viên / Admin: tạo mã giảm giá mới */
  createPromotion: async (payload: CreatePromotionPayload): Promise<PromotionDto> => {
    const res = await axiosClient.post<ApiEnvelope<PromotionDto>>(BASE, payload);
    return unwrap(res);
  },

  /** Giảng viên / Admin: cập nhật mã giảm giá */
  updatePromotion: async (promotionId: string, payload: CreatePromotionPayload): Promise<PromotionDto> => {
    const res = await axiosClient.put<ApiEnvelope<PromotionDto>>(`${BASE}/${promotionId}`, payload);
    return unwrap(res);
  },

  /** Giảng viên / Admin: xóa mã giảm giá */
  deletePromotion: async (promotionId: string): Promise<void> => {
    await axiosClient.delete(`${BASE}/${promotionId}`);
  },

  /** Gắn mã vào khóa học */
  attachToCourse: async (promotionId: string, courseId: string): Promise<PromotionDto> => {
    const res = await axiosClient.post<ApiEnvelope<PromotionDto>>(
      `${BASE}/${promotionId}/courses/${courseId}`,
    );
    return unwrap(res);
  },

  /** Gỡ mã khỏi khóa học */
  detachFromCourse: async (promotionId: string, courseId: string): Promise<PromotionDto> => {
    const res = await axiosClient.delete<ApiEnvelope<PromotionDto>>(
      `${BASE}/${promotionId}/courses/${courseId}`,
    );
    return unwrap(res);
  },

  /** Admin: Xem tất cả mã trong hệ thống */
  getAllPromotions: async (params?: { page?: number; size?: number }): Promise<PageResult<PromotionDto>> => {
    const res = await axiosClient.get<ApiEnvelope<PageDto<PromotionDto>>>(
      `${BASE}/admin/all`,
      { params: { page: params?.page ?? 0, size: params?.size ?? 20 } },
    );
    return unwrapPage(res);
  },
};

export default promotionApi;
