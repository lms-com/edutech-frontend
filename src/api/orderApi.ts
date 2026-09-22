import axiosClient from './axiosClient';

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
};

export default orderApi;
