import axiosClient from './axiosClient';
import { unwrap, unwrapPage, type ApiEnvelope, type PageDto, type PageResult } from './response';
import {
  mapPayoutRequest,
  mapInstructorBalance,
  type PayoutRequestDto,
  type BalanceInstructorDto,
} from './mappers/payoutMapper';
import type { PayoutRequest, InstructorWalletBalance } from '../types';

export interface PayoutFilterParams {
  page?: number;
  size?: number;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface ApprovePayoutPayload {
  payoutId: string;
  bankReferenceNo?: string;
  transferAt?: string;
}

export interface RejectPayoutPayload {
  payoutId: string;
  rejectReason: string;
}

export const payoutApi = {
  /**
   * Giảng viên: Tạo yêu cầu rút tiền mới
   * Body truyền raw số tiền (BigDecimal) theo thiết kế PayoutController
   */
  createPayoutRequest: async (amount: number): Promise<PayoutRequest> => {
    const res = await axiosClient.post<ApiEnvelope<PayoutRequestDto>>(
      '/finance-service/api/v1/instructor/payouts',
      amount,
      { headers: { 'Content-Type': 'application/json' } }
    );
    const dto = unwrap(res);
    return mapPayoutRequest(dto);
  },

  /**
   * Giảng viên: Lấy danh sách các yêu cầu rút tiền của bản thân
   */
  getMyPayoutRequests: async (params?: PayoutFilterParams): Promise<PageResult<PayoutRequest>> => {
    const res = await axiosClient.get<ApiEnvelope<PageDto<PayoutRequestDto>>>(
      '/finance-service/api/v1/instructor/payouts',
      {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
          status: params?.status,
          minAmount: params?.minAmount,
          maxAmount: params?.maxAmount,
          sortBy: params?.sortBy ?? 'createdAt',
          sortDir: params?.sortDir ?? 'desc',
        },
      }
    );
    const pageResult = unwrapPage(res);
    return {
      ...pageResult,
      items: pageResult.items.map(mapPayoutRequest),
    };
  },

  /**
   * Giảng viên: Lấy thông tin số dư ví thực tế từ Finance Service
   */
  getMyBalance: async (): Promise<InstructorWalletBalance> => {
    try {
      const res = await axiosClient.get<ApiEnvelope<BalanceInstructorDto>>(
        '/finance-service/api/v1/instructor/balances'
      );
      const dto = unwrap(res);
      return mapInstructorBalance(dto);
    } catch {
      // Giảng viên mới chưa có ví hoặc tài khoản DB trả về 0
      return mapInstructorBalance(null);
    }
  },

  /**
   * Quản trị viên: Lấy danh sách tất cả các yêu cầu rút tiền cần xử lý
   */
  getAdminPayouts: async (params?: PayoutFilterParams): Promise<PageResult<PayoutRequest>> => {
    const res = await axiosClient.get<ApiEnvelope<PageDto<PayoutRequestDto>>>(
      '/finance-service/api/v1/admin/payouts',
      {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
          status: params?.status,
          minAmount: params?.minAmount,
          maxAmount: params?.maxAmount,
          sortBy: params?.sortBy ?? 'createdAt',
          sortDir: params?.sortDir ?? 'desc',
        },
      }
    );
    const pageResult = unwrapPage(res);
    return {
      ...pageResult,
      items: pageResult.items.map(mapPayoutRequest),
    };
  },

  /**
   * Quản trị viên: Phê duyệt yêu cầu rút tiền (kèm mã tham chiếu ngân hàng)
   */
  approvePayout: async (payload: ApprovePayoutPayload): Promise<string> => {
    const res = await axiosClient.post<ApiEnvelope<string>>(
      '/finance-service/api/v1/admin/payouts/approve',
      {
        payoutId: payload.payoutId,
        bankReferenceNo: payload.bankReferenceNo || `REF-${Date.now()}`,
        transferAt: payload.transferAt,
      }
    );
    return unwrap(res);
  },

  /**
   * Quản trị viên: Từ chối yêu cầu rút tiền (kèm lý do)
   */
  rejectPayout: async (payload: RejectPayoutPayload): Promise<string> => {
    const res = await axiosClient.post<ApiEnvelope<string>>(
      '/finance-service/api/v1/admin/payouts/reject',
      {
        payoutId: payload.payoutId,
        rejectReason: payload.rejectReason,
      }
    );
    return unwrap(res);
  },
};

export default payoutApi;
