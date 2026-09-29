/**
 * Nhớ khóa học đang mua qua bước chuyển hướng sang VNPay.
 *
 * Thanh toán VNPay rời khỏi ứng dụng (window.location.href) rồi quay lại bằng một
 * lần nạp trang mới, nên toàn bộ state React bị mất. Không lưu lại thì sau khi
 * thanh toán không biết hiển thị kết quả cho khóa học nào.
 */
const KEY = 'pending_purchase_course_id';

export const rememberPendingPurchase = (courseId: string): void => {
  try {
    sessionStorage.setItem(KEY, courseId);
  } catch {
    // Trình duyệt chặn sessionStorage thì bỏ qua, chỉ mất phần khôi phục tiêu đề
  }
};

export const getPendingPurchase = (): string | null => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const clearPendingPurchase = (): void => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // bỏ qua
  }
};
