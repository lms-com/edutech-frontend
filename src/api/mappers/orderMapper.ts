import type { OrderSummary, OrderItem } from '../../types';
import { formatDate } from '../../utils/format';

export interface OrderDetailDto {
  id?: string;
  courseId?: string;
  courseName?: string;
  instructorId?: string;
  originalPrice?: number;
  discountAmount?: number;
  finalPrice?: number;
}

export interface OrderResponseDto {
  id: string;
  learnerId?: string;
  totalPrice?: number;
  currencyCode?: string;
  status: 'PENDING' | 'CANCELLED' | 'PAID' | 'DELETED';
  createdAt?: string;
  orderDetails?: OrderDetailDto[];
}

export const mapOrderItem = (dto: OrderDetailDto): OrderItem => ({
  id: dto.id || '',
  courseId: dto.courseId || '',
  courseName: dto.courseName || 'Khóa học',
  instructorId: dto.instructorId || '',
  originalPrice: Number(dto.originalPrice) || 0,
  discountAmount: Number(dto.discountAmount) || 0,
  finalPrice: Number(dto.finalPrice) || 0,
});

export const mapOrderSummary = (dto: OrderResponseDto): OrderSummary => ({
  id: dto.id,
  totalPrice: Number(dto.totalPrice) || 0,
  currencyCode: dto.currencyCode || 'VND',
  status: dto.status || 'PENDING',
  createdAt: formatDate(dto.createdAt),
  items: (dto.orderDetails || []).map(mapOrderItem),
});
