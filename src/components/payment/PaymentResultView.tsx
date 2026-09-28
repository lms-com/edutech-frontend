import React, { useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  PlayCircle,
  ArrowLeft,
  Receipt,
  CreditCard,
  Building2,
  Clock,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { VNPayPaymentResult } from '../../types';

interface PaymentResultViewProps {
  result: VNPayPaymentResult;
  courseTitle?: string;
  courseId?: string;
  onStartLearning: (courseId?: string) => void;
  accessError?: string | null;
  onRetry: () => void;
  onBackHome: () => void;
}

export const PaymentResultView: React.FC<PaymentResultViewProps> = ({
  result,
  courseTitle,
  courseId,
  onStartLearning,
  accessError,
  onRetry,
  onBackHome,
}) => {
  useEffect(() => {
    if (result.isSuccess) {
      // Bắn pháo hoa chào mừng học viên đăng ký thành công
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#2ecc71', '#3498db', '#e74c3c', '#f1c40f', '#9b59b6'],
        });

        // Bắn thêm đợt 2 sau 400ms
        const timer = setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
          });
        }, 400);

        return () => clearTimeout(timer);
      } catch {
        // Ignore confetti if not supported
      }
    }
  }, [result.isSuccess]);

  const formatVND = (num?: number) => {
    if (num === undefined || num === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const formatPayDate = (payDateStr?: string) => {
    if (!payDateStr || payDateStr.length < 14) return 'Vừa xong';
    const year = payDateStr.substring(0, 4);
    const month = payDateStr.substring(4, 6);
    const day = payDateStr.substring(6, 8);
    const hour = payDateStr.substring(8, 10);
    const minute = payDateStr.substring(10, 12);
    const second = payDateStr.substring(12, 14);
    return `${hour}:${minute}:${second} - ${day}/${month}/${year}`;
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div
          className={`p-8 text-center relative overflow-hidden ${
            result.isSuccess
              ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white'
              : 'bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 text-white'
          }`}
        >
          {/* Background decorative circles */}
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 shadow-inner">
              {result.isSuccess ? (
                <CheckCircle2 className="w-12 h-12 text-white animate-bounce" />
              ) : (
                <XCircle className="w-12 h-12 text-white animate-pulse" />
              )}
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-2">
              {result.isSuccess ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Giao dịch thành công
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                  Giao dịch không thành công
                </>
              )}
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {result.isSuccess ? 'Thanh Toán Thành Công!' : 'Thanh Toán Thất Bại'}
            </h1>

            <p className="mt-2 text-sm text-white/90 max-w-md leading-relaxed">
              {result.message}
            </p>
          </div>
        </div>

        {/* Transaction Details Card */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-slate-400" />
                Chi tiết hóa đơn
              </span>
              <span className="text-xs font-bold text-slate-700">
                Mã đơn: #{result.orderId ? result.orderId.substring(0, 12) : 'ORD-LMS'}
              </span>
            </div>

            {courseTitle && (
              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="text-slate-500 text-xs">Khóa học đăng ký:</span>
                <span className="font-semibold text-slate-800 text-right max-w-xs">{courseTitle}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 text-xs flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Số tiền thanh toán:
              </span>
              <span className={`text-base font-extrabold ${result.isSuccess ? 'text-emerald-600' : 'text-slate-800'}`}>
                {formatVND(result.amount)}
              </span>
            </div>

            {result.bankCode && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Ngân hàng / Cổng:
                </span>
                <span className="font-semibold text-slate-700 uppercase">
                  {result.bankCode} {result.cardType ? `(${result.cardType})` : ''}
                </span>
              </div>
            )}

            {result.transactionNo && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 text-xs flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-slate-400" />
                  Mã giao dịch VNPay:
                </span>
                <span className="font-mono text-xs font-semibold text-slate-600">{result.transactionNo}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Thời gian thực hiện:
              </span>
              <span className="text-xs font-medium text-slate-600">{formatPayDate(result.payDate)}</span>
            </div>

            {result.orderInfo && (
              <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                <span className="font-medium text-slate-600">Nội dung: </span>
                {result.orderInfo}
              </div>
            )}
          </div>

          {/* Value Highlights */}
          {result.isSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs text-emerald-950 space-y-1">
                <p className="font-bold">Cổng thanh toán trả kết quả thành công</p>
                <p className="text-emerald-800 leading-relaxed">
                  Hệ thống đang xác nhận ghi danh. Bạn chỉ có thể vào học sau khi quyền học được kích hoạt.
                </p>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            {accessError && result.isSuccess && (
              <div role="status" className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                {accessError}
              </div>
            )}
            {result.isSuccess ? (
              <button
                type="button"
                onClick={() => onStartLearning(courseId)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-xl shadow-emerald-900/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <PlayCircle className="w-5 h-5" />
                <span>Vào phòng học ngay</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onRetry}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold text-sm shadow-xl shadow-red-900/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thực hiện thanh toán lại</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBackHome}
              className="w-full py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay về danh sách khóa học</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
