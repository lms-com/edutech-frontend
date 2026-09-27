import type { VNPayPaymentResult } from '../types';

/**
 * Phân tích và chuyển đổi các tham số callback từ cổng VNPay
 * @param search - Chuỗi query params từ URL (window.location.search)
 */
export const parseVNPayCallback = (search: string): VNPayPaymentResult | null => {
  if (!search) return null;
  const params = new URLSearchParams(search);
  const responseCode = params.get('vnp_ResponseCode');

  if (!responseCode) {
    return null;
  }

  const isSuccess = responseCode === '00';
  const rawAmount = params.get('vnp_Amount');
  const amount = rawAmount ? Math.round(parseInt(rawAmount, 10) / 100) : undefined;
  const orderId = params.get('vnp_TxnRef') || undefined;
  const bankCode = params.get('vnp_BankCode') || undefined;
  const transactionNo = params.get('vnp_TransactionNo') || undefined;
  const cardType = params.get('vnp_CardType') || undefined;
  const payDate = params.get('vnp_PayDate') || undefined;
  const orderInfo = params.get('vnp_OrderInfo') ? decodeURIComponent(params.get('vnp_OrderInfo')!) : undefined;

  const errorMessages: Record<string, string> = {
    '00': 'Giao dịch thanh toán thành công qua cổng VNPay!',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
    '09': 'Thẻ/Tài khoản của quý khách chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
    '10': 'Quý khách xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
    '11': 'Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
    '12': 'Thẻ/Tài khoản của quý khách bị khóa.',
    '13': 'Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
    '24': 'Giao dịch đã bị hủy bởi quý khách.',
    '51': 'Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
    '65': 'Tài khoản của quý khách đã vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng thanh toán đang bảo trì.',
    '79': 'Quý khách nhập sai mật khẩu thanh toán quá số lần quy định.',
  };

  const message = errorMessages[responseCode] || `Giao dịch không thành công. Mã phản hồi: ${responseCode}`;

  return {
    isSuccess,
    responseCode,
    orderId,
    amount,
    bankCode,
    transactionNo,
    cardType,
    payDate,
    orderInfo,
    message,
  };
};

/**
 * Xóa sạch query parameters trên thanh địa chỉ trình duyệt để tránh bị lặp lại khi người dùng nhấn F5
 */
export const cleanUrlQueryParams = (): void => {
  if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
  }
};
