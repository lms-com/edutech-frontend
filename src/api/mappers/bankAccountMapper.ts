import type { InstructorBankAccount } from '../../types';

export interface BankAccountDto {
  id: string;
  instructorId: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isPrimary?: boolean;
}

export const VIETNAM_BANKS: Array<{ code: string; shortName: string; fullName: string }> = [
  { code: 'VCB', shortName: 'Vietcombank', fullName: 'Ngân hàng TMCP Ngoại thương Việt Nam' },
  { code: 'TCB', shortName: 'Techcombank', fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam' },
  { code: 'MB', shortName: 'MB Bank', fullName: 'Ngân hàng TMCP Quân đội' },
  { code: 'ACB', shortName: 'ACB', fullName: 'Ngân hàng TMCP Á Châu' },
  { code: 'BIDV', shortName: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { code: 'CTG', shortName: 'VietinBank', fullName: 'Ngân hàng TMCP Công thương Việt Nam' },
  { code: 'VPB', shortName: 'VPBank', fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  { code: 'TPB', shortName: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong' },
  { code: 'STB', shortName: 'Sacombank', fullName: 'Ngân hàng TMCP Sài Gòn Thương Tín' },
  { code: 'HDB', shortName: 'HDBank', fullName: 'Ngân hàng TMCP Phát triển TP.HCM' },
  { code: 'VIB', shortName: 'VIB', fullName: 'Ngân hàng TMCP Quốc tế Việt Nam' },
  { code: 'SHB', shortName: 'SHB', fullName: 'Ngân hàng TMCP Sài Gòn - Hà Nội' },
  { code: 'MSB', shortName: 'MSB', fullName: 'Ngân hàng TMCP Hàng Hải Việt Nam' },
  { code: 'OCB', shortName: 'OCB', fullName: 'Ngân hàng TMCP Phương Đông' },
  { code: 'LPB', shortName: 'LPBank', fullName: 'Ngân hàng TMCP Lộc Phát Việt Nam' },
  { code: 'AGRIBANK', shortName: 'Agribank', fullName: 'Ngân hàng Nông nghiệp & PT Nông thôn VN' },
];

export const getBankFullName = (bankCode?: string): string => {
  if (!bankCode) return 'Ngân hàng';
  const found = VIETNAM_BANKS.find(b => b.code.toUpperCase() === bankCode.toUpperCase());
  return found ? `${found.shortName} (${found.code})` : bankCode;
};

export const mapBankAccount = (dto: BankAccountDto | null): InstructorBankAccount | null => {
  if (!dto || !dto.accountNumber) return null;
  return {
    id: dto.id || '',
    instructorId: dto.instructorId || '',
    bankCode: dto.bankCode || '',
    bankName: getBankFullName(dto.bankCode),
    accountNumber: dto.accountNumber,
    accountName: dto.accountName || '',
    isPrimary: dto.isPrimary ?? true,
  };
};
