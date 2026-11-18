import React, { useState } from 'react';
import { InstructorWalletBalance, PayoutRequest } from '../../../types';
import payoutApi from '../../../api/payoutApi';
import { formatVND } from '../../../utils/format';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  KeyRound,
  Loader2,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';

interface StudioPayoutsTabProps {
  financialSessionActive: boolean;
  financialRemaining: number;
  hasPin: boolean;
  walletBalance: InstructorWalletBalance | null;
  payoutList: PayoutRequest[];
  payoutLoading: boolean;
  payoutError: string | null;
  onClearPayoutError: () => void;
  onSetPayoutError: (msg: string | null) => void;
  onOpenPinModal: () => void;
  onOpenSecuritySettings: () => void;
  onLockSession: () => void;
  onReloadPayoutData: () => Promise<void>;
}

const formatCountdown = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const StudioPayoutsTab: React.FC<StudioPayoutsTabProps> = ({
  financialSessionActive,
  financialRemaining,
  hasPin,
  walletBalance,
  payoutList,
  payoutLoading,
  payoutError,
  onSetPayoutError,
  onOpenPinModal,
  onOpenSecuritySettings,
  onLockSession,
  onReloadPayoutData,
}) => {
  const [payoutAmount, setPayoutAmount] = useState('500000');
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  const handleCreatePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(payoutAmount);
    if (isNaN(amountNum) || amountNum < 500000) {
      onSetPayoutError('Số tiền rút tối thiểu là 500.000 VNĐ theo quy định của hệ thống.');
      return;
    }
    if (walletBalance && walletBalance.availableBalance > 0 && amountNum > walletBalance.availableBalance) {
      onSetPayoutError(`Số dư khả dụng hiện tại (${formatVND(walletBalance.availableBalance)}) không đủ để tạo yêu cầu rút này.`);
      return;
    }

    setPayoutSubmitting(true);
    onSetPayoutError(null);
    setPayoutSuccessMsg('');

    try {
      await payoutApi.createPayoutRequest(amountNum);
      setPayoutSuccessMsg(`Đã gửi yêu cầu rút ${formatVND(amountNum)} thành công. Số tiền đã được tạm khóa và đang chờ Quản trị viên duyệt.`);
      await onReloadPayoutData();
      setTimeout(() => setPayoutSuccessMsg(''), 6000);
    } catch (err: any) {
      console.error('Lỗi tạo lệnh rút tiền:', err);
      onSetPayoutError(err?.message || 'Không thể tạo yêu cầu rút tiền. Vui lòng kiểm tra tài khoản ngân hàng và số dư ví.');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  if (!financialSessionActive) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-amber-200 text-center max-w-lg mx-auto space-y-4 shadow-xs animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Khu Vực Quản Lý Tiền Đang Được Khóa</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Để bảo vệ an toàn cho doanh thu và tài khoản ngân hàng của giảng viên, vui lòng nhập mã PIN bảo mật cấp 2 để mở khóa phiên làm việc (15 phút).
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            type="button"
            onClick={onOpenPinModal}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            {hasPin ? 'Mở Khóa Bằng Mã PIN Ví' : 'Thiết Lập Mã PIN Lần Đầu'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
        <div className="flex items-center gap-2 text-amber-900 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Phiên bảo mật ví đang hoạt động (Thời gian còn: <strong className="font-mono text-amber-950 font-bold">{formatCountdown(financialRemaining)}</strong>)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSecuritySettings}
            className="px-2.5 py-1 text-slate-600 hover:text-slate-800 hover:bg-amber-100 rounded-lg transition font-semibold cursor-pointer text-[11px]"
          >
            Đổi PIN / Mật khẩu
          </button>
          <button
            type="button"
            onClick={onLockSession}
            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition font-bold cursor-pointer text-[11px]"
          >
            Khóa ví ngay
          </button>
        </div>
      </div>

      {/* Wallet Balance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Số dư khả dụng</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700">
            {formatVND(walletBalance?.availableBalance ?? 0)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Có thể tạo lệnh rút tiền ngay</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Đang chờ rút</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700">
            {formatVND(walletBalance?.blockedBalance ?? 0)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Đang tạm khóa trong lệnh rút</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Chờ giải phóng</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700">
            {formatVND(walletBalance?.pendingBalance ?? 0)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Tự động giải phóng sau 3 ngày</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Tổng số dư ví</span>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800">
            {formatVND(walletBalance?.actualBalance ?? 0)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Thực tế trong tài khoản</p>
        </div>
      </div>

      <div role="status" className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs leading-relaxed text-indigo-950 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-indigo-900">Quy định rút tiền doanh thu giảng viên:</p>
          <p className="text-indigo-800 text-[11px] mt-0.5">
            Mỗi lệnh rút tối thiểu 500.000 VNĐ. Số tiền sẽ được tạm khóa từ số dư khả dụng và giải ngân về số tài khoản ngân hàng chính của giảng viên sau khi Quản trị viên duyệt lệnh.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Tạo Yêu Cầu Rút Tiền
            </h3>
          </div>

          {payoutSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-medium flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{payoutSuccessMsg}</span>
            </div>
          )}

          {payoutError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{payoutError}</span>
            </div>
          )}

          <form onSubmit={handleCreatePayoutRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số tiền cần rút (VNĐ):
              </label>
              <input
                type="number"
                min="500000"
                step="10000"
                value={payoutAmount}
                onChange={e => setPayoutAmount(e.target.value)}
                placeholder="Tối thiểu 500,000"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[500000, 1000000, 2000000, 5000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPayoutAmount(String(val))}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
                  >
                    +{formatVND(val)}
                  </button>
                ))}
                {walletBalance && walletBalance.availableBalance >= 500000 && (
                  <button
                    type="button"
                    onClick={() => setPayoutAmount(String(walletBalance.availableBalance))}
                    className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold transition cursor-pointer"
                  >
                    Rút tất cả
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700">Tài khoản nhận tiền:</p>
              <p className="text-[11px] text-slate-500">
                Hệ thống tự động sử dụng tài khoản ngân hàng chính đã đăng ký trong hồ sơ giảng viên của bạn.
              </p>
            </div>

            <button
              type="submit"
              disabled={payoutSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {payoutSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang gửi yêu cầu...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Gửi Lệnh Rút Tiền
                </>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Lịch Sử Yêu Cầu Rút Tiền</h3>
              <p className="text-xs text-slate-500">Theo dõi tiến độ duyệt chi và thông tin giải ngân.</p>
            </div>
            <button
              type="button"
              onClick={() => void onReloadPayoutData()}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
            >
              Làm mới
            </button>
          </div>

          {payoutLoading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs">Đang tải lịch sử rút tiền...</span>
            </div>
          ) : payoutList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-xs font-medium">Chưa có yêu cầu rút tiền nào.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Mã GD</th>
                    <th className="p-3">Số tiền</th>
                    <th className="p-3">Ngân hàng</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payoutList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono text-[11px] text-slate-500">{item.id}</td>
                      <td className="p-3 font-bold text-emerald-700 text-sm">
                        {formatVND(item.amount)}
                      </td>
                      <td className="p-3 text-slate-600">
                        <div>{item.bankName}</div>
                        {item.bankAccount && (
                          <div className="font-mono text-[11px] text-slate-500">
                            {item.bankAccount} {item.bankOwner ? `(${item.bankOwner})` : ''}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'APPROVED' || item.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : item.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {item.status === 'APPROVED' || item.status === 'SUCCESS'
                            ? 'Đã duyệt chi'
                            : item.status === 'REJECTED'
                            ? 'Bị từ chối'
                            : 'Chờ Admin duyệt'}
                        </span>
                        {item.rejectReason && (
                          <p className="text-[10px] text-rose-600 mt-1">Lý do: {item.rejectReason}</p>
                        )}
                        {item.bankReferenceNo && (
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Số GD: {item.bankReferenceNo}</p>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">{item.requestedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
