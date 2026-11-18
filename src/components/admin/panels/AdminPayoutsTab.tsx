import React, { useState } from 'react';
import type { PayoutRequest } from '../../../types';
import payoutApi from '../../../api/payoutApi';
import { formatVND } from '../../../utils/format';
import {
  AlertCircle,
  DollarSign,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface AdminPayoutsTabProps {
  financialSessionActive: boolean;
  financialRemaining: number;
  hasPin: boolean;
  payoutList: PayoutRequest[];
  payoutLoading: boolean;
  payoutError: string | null;
  payoutFilterStatus: string;
  onChangeFilterStatus: (status: string) => void;
  onReloadPayouts: (status?: string) => Promise<void>;
  onSetPayoutError: (msg: string | null) => void;
  onSuccess: (msg: string) => void;
  onOpenPinModal: () => void;
  onOpenSecuritySettings: () => void;
  onLockSession: () => void;
}

const formatCountdown = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const AdminPayoutsTab: React.FC<AdminPayoutsTabProps> = ({
  financialSessionActive,
  financialRemaining,
  hasPin,
  payoutList,
  payoutLoading,
  payoutError,
  payoutFilterStatus,
  onChangeFilterStatus,
  onReloadPayouts,
  onSetPayoutError,
  onSuccess,
  onOpenPinModal,
  onOpenSecuritySettings,
  onLockSession,
}) => {
  const [approvingPayout, setApprovingPayout] = useState<PayoutRequest | null>(null);
  const [bankRefNo, setBankRefNo] = useState('');
  const [approvingSubmitting, setApprovingSubmitting] = useState(false);

  const [rejectingPayout, setRejectingPayout] = useState<PayoutRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingSubmitting, setRejectingSubmitting] = useState(false);

  const handleConfirmApprovePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingPayout) return;
    setApprovingSubmitting(true);
    onSetPayoutError(null);
    try {
      await payoutApi.approvePayout({
        payoutId: approvingPayout.id,
        bankReferenceNo: bankRefNo.trim() || `REF-${Date.now()}`,
        transferAt: new Date().toISOString().slice(0, 19),
      });
      onSuccess(`Đã duyệt chi trả thành công cho yêu cầu #${approvingPayout.id}.`);
      setApprovingPayout(null);
      setBankRefNo('');
      await onReloadPayouts(payoutFilterStatus);
    } catch (err: any) {
      onSetPayoutError(err?.message || 'Không thể phê duyệt yêu cầu rút tiền.');
    } finally {
      setApprovingSubmitting(false);
    }
  };

  const handleConfirmRejectPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayout) return;
    if (!rejectReason.trim()) {
      onSetPayoutError('Vui lòng nhập lý do từ chối yêu cầu.');
      return;
    }
    setRejectingSubmitting(true);
    onSetPayoutError(null);
    try {
      await payoutApi.rejectPayout({
        payoutId: rejectingPayout.id,
        rejectReason: rejectReason.trim(),
      });
      onSuccess(`Đã từ chối yêu cầu #${rejectingPayout.id} và hoàn lại tiền khả dụng cho giảng viên.`);
      setRejectingPayout(null);
      setRejectReason('');
      await onReloadPayouts(payoutFilterStatus);
    } catch (err: any) {
      onSetPayoutError(err?.message || 'Không thể từ chối yêu cầu rút tiền.');
    } finally {
      setRejectingSubmitting(false);
    }
  };

  if (!financialSessionActive) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-amber-200 text-center max-w-lg mx-auto space-y-4 shadow-xs animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Khu Vực Phê Duyệt Chi Tiền Đang Được Khóa</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Để bảo vệ an toàn cho ngân quỹ hệ thống và tránh thao tác chi trả trái phép, vui lòng xác thực mã PIN bảo mật cấp 2 để mở khóa phiên làm việc (15 phút).
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            type="button"
            onClick={onOpenPinModal}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            {hasPin ? 'Mở Khóa Bằng Mã PIN Quản Trị' : 'Thiết Lập Mã PIN Lần Đầu'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-amber-900 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Phiên bảo mật phê duyệt chi trả đang hoạt động (Thời gian còn: <strong className="font-mono text-amber-950 font-bold">{formatCountdown(financialRemaining)}</strong>)</span>
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
            Khóa phiên ngay
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">Duyệt Yêu Cầu Rút Tiền Từ Giảng Viên (Payout Requests)</h3>
            <p className="text-xs text-slate-500">Đối soát số dư ví và phê duyệt lệnh chi trả chuyển khoản doanh thu.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              {(['ALL', 'PENDING', 'SUCCESS', 'REJECTED'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onChangeFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    payoutFilterStatus === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'Tất cả' : st === 'PENDING' ? 'Chờ duyệt' : st === 'SUCCESS' ? 'Đã chi trả' : 'Bị từ chối'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void onReloadPayouts(payoutFilterStatus)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              title="Làm mới"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${payoutLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {payoutError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{payoutError}</span>
          </div>
        )}

        {payoutLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Đang tải danh sách lệnh rút tiền từ Finance Service...</span>
          </div>
        ) : payoutList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs font-medium">Không có yêu cầu rút tiền nào trong danh sách.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">Giảng viên / Mã GD</th>
                  <th className="p-3">Số tiền rút</th>
                  <th className="p-3">Thông tin tài khoản nhận</th>
                  <th className="p-3">Thời gian gửi</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payoutList.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <p className="font-bold text-slate-800">{p.instructorName || 'Giảng viên'}</p>
                      {p.instructorId && <p className="text-[10px] text-indigo-600 font-mono">GV: {p.instructorId}</p>}
                      <span className="text-[10px] text-slate-400 font-mono">{p.id}</span>
                    </td>
                    <td className="p-3 font-bold text-emerald-700 text-sm">
                      {formatVND(p.amount)}
                    </td>
                    <td className="p-3 text-slate-600">
                      <div className="font-medium text-slate-800">{p.bankName}</div>
                      <div className="font-mono text-[11px] text-slate-600">
                        {p.bankAccount} {p.bankOwner ? `(${p.bankOwner})` : ''}
                      </div>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {p.requestedAt}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'APPROVED' || p.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : p.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {p.status === 'APPROVED' || p.status === 'SUCCESS'
                          ? 'Đã chi trả'
                          : p.status === 'REJECTED'
                          ? 'Bị từ chối'
                          : 'Chờ duyệt chi'}
                      </span>
                      {p.bankReferenceNo && (
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">Số GD: {p.bankReferenceNo}</p>
                      )}
                      {p.rejectReason && (
                        <p className="text-[10px] text-rose-600 mt-0.5">Lý do: {p.rejectReason}</p>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {p.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setApprovingPayout(p);
                              setBankRefNo('');
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            Duyệt Chi
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingPayout(p);
                              setRejectReason('');
                            }}
                            className="px-2.5 py-1.5 border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">Hoàn tất</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {approvingPayout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Phê duyệt lệnh chi trả giảng viên</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xác nhận đã chuyển khoản thành công từ tài khoản ngân hàng của nền tảng.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã lệnh:</span>
                  <span className="font-mono text-slate-800">{approvingPayout.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tiền:</span>
                  <strong className="text-emerald-700 text-sm font-extrabold">{formatVND(approvingPayout.amount)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                  <span className="font-semibold text-slate-800">{approvingPayout.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <span className="font-mono font-bold text-slate-900">{approvingPayout.bankAccount} ({approvingPayout.bankOwner})</span>
                </div>
              </div>

              <form onSubmit={handleConfirmApprovePayout} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã tham chiếu ngân hàng / Số bút toán (Bank Ref No):
                  </label>
                  <input
                    type="text"
                    value={bankRefNo}
                    onChange={e => setBankRefNo(e.target.value)}
                    placeholder="VD: FT261009123456 hoặc VCB_REF_01"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Để trống hệ thống sẽ tự sinh mã tham chiếu đối soát.</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={approvingSubmitting}
                    onClick={() => setApprovingPayout(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={approvingSubmitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {approvingSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Xác nhận Duyệt Chi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {rejectingPayout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div>
                <h4 className="text-base font-bold text-rose-900">Từ chối lệnh rút tiền</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Số tiền tạm khóa sẽ được hoàn trả lại vào số dư khả dụng của giảng viên.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã lệnh:</span>
                  <span className="font-mono text-slate-800">{rejectingPayout.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tiền:</span>
                  <strong className="text-slate-800 font-bold">{formatVND(rejectingPayout.amount)}</strong>
                </div>
              </div>

              <form onSubmit={handleConfirmRejectPayout} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lý do từ chối (bắt buộc):
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="VD: Sai thông tin chủ tài khoản ngân hàng thụ hưởng, vui lòng cập nhật lại..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={rejectingSubmitting}
                    onClick={() => setRejectingPayout(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={rejectingSubmitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {rejectingSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Xác nhận Từ Chối
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
