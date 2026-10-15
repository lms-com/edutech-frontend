import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  BookOpen, 
  GraduationCap, 
  Video, 
  CreditCard, 
  Award, 
  HelpCircle, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronRight,
  Sparkles,
  RotateCcw,
  Wallet
} from 'lucide-react';
import type { PortalType } from '../../types';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'learner' | 'instructor';
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'learner',
}) => {
  const [activeTab, setActiveTab] = useState<'learner' | 'instructor'>(defaultRole);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1e293b] p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-400/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg">Cẩm Nang Hướng Dẫn Sử Dụng EduTech</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tất cả thông tin và thao tác cần thiết dành cho người dùng</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Switcher */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-200 bg-slate-50 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('learner')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'learner'
                ? 'bg-[#2c3e50] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>Dành cho Học viên</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('instructor')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'instructor'
                ? 'bg-[#2c3e50] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Video className="w-4 h-4 text-[#e74c3c]" />
            <span>Dành cho Giảng viên</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs md:text-sm leading-relaxed">
          {activeTab === 'learner' ? (
            <div className="space-y-6">
              {/* Bước 1: Tìm kiếm & Đăng ký */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">1</span>
                  <span>Đăng ký tài khoản & Xác thực Email OTP</span>
                </div>
                <p className="text-slate-600">
                  Nhập họ tên, email và mật khẩu tại bảng Đăng ký, đánh dấu đồng ý <strong>Điều khoản dịch vụ</strong>. Sau đó nhập mã <strong>OTP gồm 6 số</strong> được gửi về hòm thư để kích hoạt tài khoản chính thức. Bạn cũng có thể đăng nhập tức thì bằng tài khoản Google.
                </p>
              </div>

              {/* Bước 2: Thanh toán VNPay an toàn */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">2</span>
                  <span>Mua khóa học & Thanh toán VNPay ở Tab mới</span>
                </div>
                <p className="text-slate-600">
                  Bấm <em>"Đăng ký và thanh toán VNPay"</em>. Cổng thanh toán sẽ được mở ở một tab mới độc lập. Sau khi bạn hoàn tất quét mã QR hoặc nhập thẻ trên VNPay, tab học chính sẽ tự động kích hoạt quyền học và chuyển bạn thẳng vào phòng học.
                </p>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Chính sách bảo vệ 3 ngày:</strong> Nếu khóa học không đúng cam kết, bạn có thể bấm "Lịch sử đơn hàng" ở menu avatar và gửi yêu cầu hoàn tiền trong vòng 3 ngày.</span>
                </div>
              </div>

              {/* Bước 3: Vào phòng học & Thi trắc nghiệm */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">3</span>
                  <span>Học tập & Kiểm tra kiến thức qua Trắc nghiệm</span>
                </div>
                <p className="text-slate-600">
                  Trong phòng học, bạn có thể xem video bài giảng, đánh dấu hoàn thành bài học. Cuối mỗi chương thường có bài trắc nghiệm tính giờ: bấm nộp bài để hệ thống tự động chấm điểm và xem lời giải thích chi tiết cho từng câu.
                </p>
              </div>

              {/* Bước 4: Nhận chứng chỉ & Đánh giá */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">4</span>
                  <span>Nhận Chứng chỉ tốt nghiệp & Đánh giá khóa học</span>
                </div>
                <p className="text-slate-600">
                  Khi hoàn thành 100% nội dung, hệ thống tự động cấp Chứng chỉ tốt nghiệp chuẩn A4 có mã QR xác thực công khai. Đừng quên đánh giá từ 1 đến 5 sao tại trang chi tiết để chia sẻ trải nghiệm cho các học viên khác.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bước 1: Nộp đơn trở thành Giảng viên */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold">
                  <span className="w-6 h-6 rounded-lg bg-red-100 text-[#e74c3c] flex items-center justify-center text-xs">1</span>
                  <span>Quy trình nộp đơn & Xét duyệt Giảng viên</span>
                </div>
                <p className="text-slate-600">
                  Người dùng có thể gửi thông tin tiểu sử, chuyên môn và liên kết portfolio/CV để nộp đơn làm giảng viên. Sau khi Quản trị viên (Admin) xét duyệt hồ sơ, bạn sẽ nhận được thông báo in-app kèm email và được cấp thêm quyền <strong>INSTRUCTOR</strong>.
                </p>
              </div>

              {/* Bước 2: Soạn thảo khóa học trong Studio */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold">
                  <span className="w-6 h-6 rounded-lg bg-red-100 text-[#e74c3c] flex items-center justify-center text-xs">2</span>
                  <span>Soạn giáo trình & Ngân hàng trắc nghiệm (Studio)</span>
                </div>
                <p className="text-slate-600">
                  Truy cập cổng <strong>Studio</strong> trên thanh điều hướng để:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2">
                  <li>Tạo khóa học mới, gắn link ảnh đại diện (Thumbnail URL) có xem trước trực quan.</li>
                  <li>Tạo các chương (Sections) và bài học (Lessons) kèm video bài giảng.</li>
                  <li>Soạn ngân hàng câu hỏi trắc nghiệm (Quiz Bank), thiết lập đáp án đúng và lời giải thích.</li>
                </ul>
              </div>

              {/* Bước 3: Thiết lập ví & Liên kết ngân hàng */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold">
                  <span className="w-6 h-6 rounded-lg bg-red-100 text-[#e74c3c] flex items-center justify-center text-xs">3</span>
                  <span>Cài đặt Mã PIN & Liên kết Tài khoản Ngân hàng</span>
                </div>
                <p className="text-slate-600">
                  Doanh thu bán khóa học sẽ được tự động hạch toán vào <strong>Số dư khả dụng</strong> theo tỷ lệ quy định (70% Giảng viên). Để rút tiền:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-2">
                  <li>Bấm vào avatar góc phải $\rightarrow$ <em>"Cài đặt bảo mật"</em> để thiết lập <strong>Mã PIN 6 số</strong>.</li>
                  <li>Vào <em>"Ví doanh thu"</em> $\rightarrow$ Bấm <em>"Liên kết tài khoản ngân hàng"</em> (nhập mã PIN để xác thực).</li>
                  <li>Thực hiện lệnh rút tiền về tài khoản ngân hàng đã liên kết bất kỳ lúc nào.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            Đã hiểu & Đóng hướng dẫn
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
