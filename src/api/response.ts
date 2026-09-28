/**
 * Chuẩn hoá lớp vỏ phản hồi của backend.
 *
 * Mọi endpoint đều bọc kết quả trong ApiResponse{code, message, data}, còn các
 * endpoint phân trang bọc thêm một lớp Spring Data Page. Trước đây mỗi hàm gọi
 * API tự đoán bằng `res?.data || res`, đoán sai thì không báo lỗi mà trả về
 * nguyên object Page — đó là lý do danh sách khóa học luôn rơi về dữ liệu cứng.
 * Gom vào một chỗ để chỉ có một cách hiểu duy nhất.
 */

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

/** Hình dạng Spring Data Page trả về trong JSON. */
export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

/** Danh sách kèm thông tin phân trang, đã bóc vỏ. */
export interface PageResult<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/**
 * Bóc lớp ApiResponse và coi mã khác 200 là lỗi.
 *
 * Backend đôi khi trả HTTP 200 kèm code lỗi trong thân, nên không thể chỉ dựa
 * vào HTTP status.
 */
export const unwrap = <T>(envelope: ApiEnvelope<T> | undefined | null): T => {
  if (envelope == null) {
    throw new Error('Máy chủ trả về dữ liệu rỗng.');
  }
  if (typeof envelope.code === 'number' && envelope.code !== 200) {
    throw new Error(envelope.message || `Máy chủ trả về mã lỗi ${envelope.code}.`);
  }
  if (envelope.data === undefined || envelope.data === null) {
    throw new Error(envelope.message || 'Máy chủ không trả về dữ liệu.');
  }
  return envelope.data;
};

/** Bóc ApiResponse<Page<T>> thành danh sách kèm thông tin phân trang. */
export const unwrapPage = <T>(envelope: ApiEnvelope<PageDto<T>> | undefined | null): PageResult<T> => {
  const page = unwrap(envelope);
  return {
    items: page.content ?? [],
    totalElements: page.totalElements ?? 0,
    totalPages: page.totalPages ?? 0,
    page: page.number ?? 0,
    size: page.size ?? 0,
  };
};
