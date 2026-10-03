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
};

export default orderApi;
