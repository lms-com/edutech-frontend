import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  ShieldCheck 
} from 'lucide-react';
import { VIETNAM_BANKS } from '../../api/mappers/bankAccountMapper';
import { bankAccountApi } from '../../api/bankAccountApi';
import type { InstructorBankAccount } from '../../types';

interface BankAccountConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccount: InstructorBankAccount | null;
  onSaved: (account: InstructorBankAccount) => void;
}

export const BankAccountConnectModal: React.FC<BankAccountConnectModalProps> = ({
  isOpen,
  onClose,
  currentAccount,
  onSaved,
}) => {
  const [bankCode, setBankCode] = useState(currentAccount?.bankCode || 'VCB');
  const [accountNumber, setAccountNumber] = useState(currentAccount?.accountNumber || '');
  const [accountName, setAccountName] = useState(currentAccount?.accountName || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBankCode(currentAccount?.bankCode || 'VCB');
      setAccountNumber(currentAccount?.accountNumber || '');
      setAccountName(currentAccount?.accountName || '');
      setError(null);
    }
  }, [isOpen, currentAccount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = accountNumber.trim().replace(/\s+/g, '');
    const cleanName = accountName.trim().toUpperCase();

    if (!cleanNum || cleanNum.length < 6) {
      setError('Số tài khoản không hợp lệ (tối thiểu 6 ký tự)');
      return;
    }
    if (!cleanName || cleanName.length < 3) {
      setError('Vui lòng nhập họ và tên chủ tài khoản (viết hoa)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const saved = await bankAccountApi.saveBankAccount({
        bankCode,
        accountNumber: cleanNum,
        accountName: cleanName,
      });
      onSaved(saved);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu thông tin tài khoản ngân hàng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-[#2c3e50] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {currentAccount ? 'Cập Nhật Tài Khoản Ngân Hàng' : 'Liên Kết Tài Khoản Ngân Hàng'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">Tài khoản chính để nhận thanh toán giải ngân định kỳ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Chọn ngân hàng */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Ngân hàng thụ hưởng <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={bankCode}
                onChange={e => setBankCode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
              >
                {VIETNAM_BANKS.map(b => (
                  <option key={b.code} value={b.code}>
                    {b.shortName} ({b.code}) — {b.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Số tài khoản */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Số tài khoản ngân hàng <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                required
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                placeholder="Ví dụ: 19034567891011"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 font-mono tracking-wider focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <p className="text-[10px] text-slate-400">Chỉ điền số hoặc chữ cái, không chứa khoảng trắng</p>
          </div>

          {/* Tên chủ thẻ */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Họ và tên chủ tài khoản <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                required
                type="text"
                value={accountName}
                onChange={e => setAccountName(e.target.value.toUpperCase())}
                placeholder="NGUYEN VAN A"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 uppercase font-bold focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <p className="text-[10px] text-slate-400">Tên viết hoa không dấu, trùng khớp hoàn toàn trên thẻ/app ngân hàng</p>
          </div>

          {/* Lưu ý bảo mật */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Mọi lệnh rút tiền của bạn sẽ được tự động giải ngân về tài khoản này sau khi Ban quản trị phê duyệt.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Xác nhận lưu
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
