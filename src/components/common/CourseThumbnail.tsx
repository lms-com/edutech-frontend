import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';

interface CourseThumbnailProps {
  src?: string;
  alt: string;
  className?: string;
}

/**
 * Ảnh bìa khóa học kèm trạng thái dự phòng.
 *
 * Dữ liệu thật hiện trỏ tới https://example.com/... nên ảnh luôn tải lỗi; nếu
 * không xử lý, mọi thẻ khóa học sẽ hiện biểu tượng ảnh vỡ. Đây là phần "trạng
 * thái lỗi" bắt buộc phải có trong một design system: mọi thành phần hiển thị
 * nội dung từ xa đều cần trạng thái trống/lỗi.
 */
export const CourseThumbnail: React.FC<CourseThumbnailProps> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center`}
        role="img"
        aria-label={alt}
      >
        <GraduationCap className="w-10 h-10 text-slate-400" />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
};

export default CourseThumbnail;
