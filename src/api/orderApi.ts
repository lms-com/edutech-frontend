import axiosClient from './axiosClient';
import { unwrap, unwrapPage, type ApiEnvelope, type PageDto, type PageResult } from './response';
import { mapOrderSummary, type OrderResponseDto } from './mappers/orderMapper';
import type { OrderSummary } from '../types';

export interface CartItemOrder {
  courseId: string;
  promotionCode?: string;
}

export interface CreateOrderRequest {
  items: CartItemOrder[];
  paymentMethod?: string; // Mặc định VNPAY
}

export interface CreateOrderResponse {
  paymentUrl: string;
}

export const orderApi = {
  // Tạo đơn hàng và nhận URL thanh toán (VNPay Gateway)
  createOrder: async (payload: CreateOrderRequest): Promise<CreateOrderResponse> => {
    const body = {
      items: payload.items,
      paymentMethod: payload.paymentMethod || 'VNPAY',
    };
    const res: any = await axiosClient.post('/order-service/api/v1/orders', body);
    return res?.data || res;
  },

  // Lấy lịch sử đơn hàng của học viên (có phân trang)
  getMyOrders: async (params?: { page?: number; size?: number }): Promise<PageResult<OrderSummary>> => {
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    const res = await axiosClient.get<ApiEnvelope<PageDto<OrderResponseDto>>>('/order-service/api/v1/orders/me', {
      params: { page, size },
    });
    const pageResult = unwrapPage(res);
    return {
      ...pageResult,
      items: pageResult.items.map(mapOrderSummary),
    };
  },

  // Xem chi tiết đơn hàng
  getOrderDetail: async (orderId: string): Promise<OrderSummary> => {
    const res = await axiosClient.get<ApiEnvelope<OrderResponseDto>>(`/order-service/api/v1/orders/${orderId}`);
    const dto = unwrap(res);
    return mapOrderSummary(dto);
  },

  // Học viên gửi yêu cầu khiếu nại / hoàn tiền (trong 3 ngày)
  requestRefund: async (orderId: string, payload: { reason: string; detail?: string }): Promise<any> => {
    const res = await axiosClient.post<ApiEnvelope<any>>(`/order-service/api/v1/orders/${orderId}/refund-request`, payload);
    return unwrap(res);
  },

  // Học viên tra cứu trạng thái khiếu nại của đơn hàng
  getRefundRequest: async (orderId: string): Promise<any> => {
    const res = await axiosClient.get<ApiEnvelope<any>>(`/order-service/api/v1/orders/${orderId}/refund-request`);
    return unwrap(res);
  },

  // Admin: Lấy danh sách khiếu nại hoàn tiền
  getAdminRefundRequests: async (params?: { status?: string; page?: number; size?: number }): Promise<PageResult<any>> => {
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    const queryParams: any = { page, size };
    if (params?.status && params.status !== 'ALL') {
      queryParams.status = params.status;
    }
    const res = await axiosClient.get<ApiEnvelope<PageDto<any>>>('/order-service/api/v1/orders/admin/refund-requests', {
      params: queryParams,
    });
    return unwrapPage(res);
  },

  // Admin: Phê duyệt hoàn tiền
  approveRefund: async (requestId: string, payload?: { note?: string }): Promise<any> => {
    const res = await axiosClient.put<ApiEnvelope<any>>(`/order-service/api/v1/orders/admin/refund-requests/${requestId}/approve`, payload || {});
    return unwrap(res);
  },

  // Admin: Từ chối hoàn tiền
  rejectRefund: async (requestId: string, payload: { note: string }): Promise<any> => {
    const res = await axiosClient.put<ApiEnvelope<any>>(`/order-service/api/v1/orders/admin/refund-requests/${requestId}/reject`, payload);
    return unwrap(res);
  },
};

export default orderApi;
