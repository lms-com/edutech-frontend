import React from 'react';
import { 
  ExternalLink, 
  Loader2, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  RefreshCw 
} from 'lucide-react';
import { formatVND } from '../../utils/format';
import type { Course } from '../../types';

interface PaymentWaitingModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  paymentUrl: string;
  onCheckStatus: () => void;
  checking: boolean;
}

export const PaymentWaitingModal: React.FC<PaymentWaitingModalProps> = ({
  isOpen,
  onClose,
  course,
  paymentUrl,
  onCheckStatus,
  checking,
}) => {
  if (!isOpen) return null;

  const handleReopenTab = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1e293b] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Đang Chờ Thanh Toán VNPay</h3>
              <p className="text-xs text-slate-400 mt-0.5">Trang thanh toán đã được mở ở tab mới</p>
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
        <div className="p-6 space-y-5">
          {/* Status animation */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping opacity-25" />
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-800">
                Vui lòng hoàn tất thanh toán trên cổng VNPay
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Hệ thống đang tự động kiểm tra và sẽ kích hoạt khóa học vào tài khoản của bạn ngay khi giao dịch thành công.
              </p>
            </div>
          </div>

          {/* Course Details info */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Khóa học:</span>
              <span className="font-bold text-slate-800 text-right truncate max-w-[260px]">
                {course.title}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-500">Tổng thanh toán:</span>
              <span className="font-extrabold text-[#e74c3c] text-sm font-mono">
                {formatVND(course.price)}
              </span>
            </div>
          </div>

          {/* Action helpers */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={onCheckStatus}
              disabled={checking}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang kiểm tra quyền học...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Tôi đã thanh toán xong (Kích hoạt ngay)
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReopenTab}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              Mở lại tab thanh toán VNPay
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Bạn có thể đóng cửa sổ này bất cứ lúc nào. Đơn hàng vẫn được bảo lưu an toàn.
        </div>
      </div>
    </div>
  );
};
