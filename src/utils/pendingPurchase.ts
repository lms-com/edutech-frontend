/**
 * Nhớ khóa học đang mua qua bước chuyển hướng sang VNPay.
 *
 * Thanh toán VNPay có thể chuyển hướng trang hiện tại hoặc mở tab mới.
 * Đồng bộ cả sessionStorage và localStorage để đảm bảo mọi tab đều khôi phục được khóa học.
 */
const KEY = 'pending_purchase_course_id';

export const rememberPendingPurchase = (courseId: string): void => {
  try {
    sessionStorage.setItem(KEY, courseId);
    localStorage.setItem(KEY, courseId);
  } catch {
    // Trình duyệt chặn storage thì bỏ qua
  }
};

export const getPendingPurchase = (): string | null => {
  try {
    return sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const clearPendingPurchase = (): void => {
  try {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  } catch {
    // bỏ qua
  }
};
