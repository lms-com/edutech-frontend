import axiosClient from './axiosClient';
import { unwrapPage, unwrap, type ApiEnvelope, type PageDto, type PageResult } from './response';

export interface AdminUserItem {
  id: string;
  email: string;
  fullName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED';
  roles: string[];
}

export interface UpdateUserStatusPayload {
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED';
  reason?: string;
}

const BASE = '/iam-service/api/v1/admin/users';

export const userApi = {
  /**
   * Lấy danh sách người dùng cho Admin (kèm tìm kiếm & phân trang)
   */
  getUsers: async (params?: {
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PageResult<AdminUserItem>> => {
    const res = await axiosClient.get<ApiEnvelope<PageDto<AdminUserItem>>>(BASE, {
      params: {
        search: params?.search || undefined,
        page: params?.page ?? 0,
        size: params?.size ?? 10,
      },
    });
    return unwrapPage(res);
  },

  /**
   * Khóa hoặc Mở khóa tài khoản người dùng
   */
  updateUserStatus: async (
    userId: string,
    payload: UpdateUserStatusPayload
  ): Promise<void> => {
    const res = await axiosClient.put<ApiEnvelope<any>>(`${BASE}/${userId}/status`, payload);
    unwrap(res);
  },
};

export default userApi;
