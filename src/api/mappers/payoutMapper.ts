import type { PayoutRequest, InstructorWalletBalance } from '../../types';
import { formatDateTime } from '../../utils/format';

export interface PayoutRequestDto {
  payoutId: string;
  amount: number;
  status: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  createdAt?: string;
  processedAt?: string;
  rejectReason?: string;
  bankReferenceNo?: string;
}

export interface BalanceInstructorDto {
  actualBalance?: number;
  availableBalance?: number;
  blockedBalance?: number;
  pendingBalance?: number;
}

export const mapPayoutRequest = (dto: PayoutRequestDto): PayoutRequest => {
  const rawStatus = (dto.status || 'PENDING').toUpperCase();
  const normalizedStatus = rawStatus === 'SUCCESS' ? 'APPROVED' : (rawStatus as PayoutRequest['status']);

  return {
    id: dto.payoutId || '',
    instructorId: '',
    instructorName: dto.accountName || 'Giảng viên',
    amount: Number(dto.amount) || 0,
    currencyCode: 'VND',
    bankName: dto.bankCode || 'Ngân hàng',
    bankAccount: dto.accountNumber || '',
    bankOwner: dto.accountName || '',
    status: normalizedStatus,
    requestedAt: dto.createdAt ? formatDateTime(dto.createdAt) : 'Vừa xong',
    processedAt: dto.processedAt ? formatDateTime(dto.processedAt) : undefined,
    rejectReason: dto.rejectReason,
    bankReferenceNo: dto.bankReferenceNo,
  };
};

export const mapInstructorBalance = (dto?: BalanceInstructorDto | null): InstructorWalletBalance => ({
  actualBalance: Number(dto?.actualBalance) || 0,
  availableBalance: Number(dto?.availableBalance) || 0,
  blockedBalance: Number(dto?.blockedBalance) || 0,
  pendingBalance: Number(dto?.pendingBalance) || 0,
});
