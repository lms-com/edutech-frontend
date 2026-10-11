import React from 'react';
import { X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  onAccept,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#1e293b] p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Điều Khoản Dịch Vụ & Chính Sách Người Dùng</h3>
              <p className="text-xs text-slate-400 mt-0.5">EduTech Learning Management System</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-sm">1. Điều khoản chung</h4>
            <p>
              Chào mừng bạn đến với EduTech LMS. Bằng cách đăng ký tài khoản hoặc sử dụng dịch vụ trên hệ thống của chúng tôi, bạn đồng ý tuân thủ toàn bộ các quy định và chính sách được nêu tại đây. Nếu không đồng ý với bất kỳ điều khoản nào, vui lòng dừng sử dụng hệ thống.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-sm">2. Tài khoản & Bảo mật cá nhân</h4>
            <p>
              Người dùng chịu trách nhiệm duy trì tính bảo mật của thông tin tài khoản, mật khẩu, mã OTP và mã PIN bảo mật cá nhân. Mọi hoạt động phát sinh từ tài khoản của bạn sẽ được coi là do chính bạn thực hiện.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-sm">3. Quyền sở hữu trí tuệ & Bản quyền nội dung</h4>
            <p>
              Toàn bộ bài giảng, video, tài liệu và ngân hàng câu hỏi trắc nghiệm trên nền tảng thuộc quyền sở hữu của Giảng viên hoặc EduTech. Nghiêm cấm hành vi sao chép, tải lậu, phát tán hoặc bán lại nội dung khóa học khi chưa được sự đồng ý bằng văn bản.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-sm">4. Chính sách Bảo vệ học viên & Hoàn tiền 7 ngày</h4>
            <p>
              EduTech cam kết bảo vệ quyền lợi học tập của học viên. Trong vòng <strong>7 ngày</strong> kể từ thời điểm thanh toán thành công, nếu khóa học không đúng với mô tả, bài giảng bị lỗi nghiêm trọng hoặc giảng viên không hỗ trợ, học viên có quyền gửi yêu cầu hoàn tiền qua hệ thống và nhận lại 100% học phí đã thanh toán.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-sm">5. Quy định dành cho Giảng viên</h4>
            <p>
              Giảng viên cam kết cung cấp nội dung chính xác, không vi phạm pháp luật hoặc thuần phong mỹ tục. Doanh thu khóa học sẽ được hạch toán minh bạch vào Ví số dư và chi trả theo đúng thông tin tài khoản ngân hàng đã được liên kết và xác thực bằng mã PIN bảo mật.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 italic">Cập nhật lần cuối: Tháng 10/2026</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 font-semibold text-xs transition cursor-pointer"
            >
              Đóng
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Tôi đồng ý điều khoản</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
