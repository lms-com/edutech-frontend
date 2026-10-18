import axiosClient from './axiosClient';
import { unwrap, type ApiEnvelope } from './response';
import {
  mapBankAccount,
  type BankAccountDto,
} from './mappers/bankAccountMapper';
import type { InstructorBankAccount } from '../types';

export interface SaveBankAccountPayload {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export const bankAccountApi = {
  /**
   * Giảng viên: Lấy tài khoản ngân hàng chính để nhận tiền
   */
  getPrimaryBankAccount: async (): Promise<InstructorBankAccount | null> => {
    const res = await axiosClient.get<ApiEnvelope<BankAccountDto>>(
      '/finance-service/api/v1/instructor/bank-accounts/primary'
    );
    const dto = unwrap(res);
    return mapBankAccount(dto);
  },

  /**
   * Giảng viên: Liên kết hoặc cập nhật thông tin tài khoản ngân hàng
   */
  saveBankAccount: async (payload: SaveBankAccountPayload): Promise<InstructorBankAccount> => {
    const res = await axiosClient.post<ApiEnvelope<BankAccountDto>>(
      '/finance-service/api/v1/instructor/bank-accounts',
      payload
    );
    const dto = unwrap(res);
    const mapped = mapBankAccount(dto);
    if (!mapped) throw new Error('Không thể lưu thông tin tài khoản ngân hàng');
    return mapped;
  },
};
