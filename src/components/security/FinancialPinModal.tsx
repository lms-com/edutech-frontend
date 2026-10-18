import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, KeyRound, AlertCircle, CheckCircle2, RotateCcw, X, ArrowRight, ShieldAlert } from 'lucide-react';
import { securityApi } from '../../api/securityApi';

interface FinancialPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hasPin: boolean;
  onPinCreated?: () => void;
}

export const FinancialPinModal: React.FC<FinancialPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  hasPin,
  onPinCreated,
}) => {
  const [mode, setMode] = useState<'verify' | 'setup' | 'forgot'>(hasPin ? 'verify' : 'setup');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setMode(hasPin ? 'verify' : 'setup');
      setPin('');
      setConfirmPin('');
      setOtp('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, hasPin]);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setErrorMsg('Vui lòng nhập đúng 6 chữ số mã PIN.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await securityApi.verifyPin({ pin });
      setSuccessMsg('Mở khóa phiên bảo mật ví thành công! (15 phút)');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Mã PIN không chính xác. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setErrorMsg('Mã PIN phải gồm đúng 6 chữ số.');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMsg('Mã PIN xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await securityApi.setupPin({ pin });
      setSuccessMsg('Thiết lập mã PIN ví thành công! Đang mở khóa bảng quản lý tiền...');
      onPinCreated?.();
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể thiết lập mã PIN. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await securityApi.sendResetPinOtp();
      setSuccessMsg('Mã OTP khôi phục PIN đã được gửi đến email đăng ký của bạn.');
      setCountdown(60);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể gửi mã OTP. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg('Vui lòng nhập đúng 6 chữ số mã OTP.');
      return;
    }
    if (pin.length !== 6) {
      setErrorMsg('Mã PIN mới phải gồm đúng 6 chữ số.');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMsg('Mã PIN xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await securityApi.resetPin({ otp, newPin: pin });
      setSuccessMsg('Đặt lại mã PIN thành công! Đang kích hoạt phiên bảo mật...');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Khôi phục mã PIN thất bại. Vui lòng kiểm tra lại OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-[#1a252f] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {mode === 'setup'
                  ? 'Thiết Lập Mã PIN Ví Bảo Mật'
                  : mode === 'forgot'
                  ? 'Khôi Phục Mã PIN Ví'
                  : 'Xác Thực Bảo Mật Cấp 2'}
              </h3>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                Bảo vệ tài chính & Phiên rút tiền (15 phút)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mode 1: Verify PIN */}
          {mode === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Khu vực nhạy cảm liên quan đến số dư và giao dịch. Vui lòng nhập mã PIN bảo mật 6 số của bạn để tiếp tục.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                  Nhập mã PIN ví (6 chữ số)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center tracking-[0.5em] font-mono font-bold text-lg py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    handleSendForgotOtp();
                  }}
                  className="text-amber-700 hover:text-amber-800 font-semibold hover:underline cursor-pointer"
                >
                  Quên mã PIN ví?
                </button>
                <span className="text-slate-400 text-[11px]">Hiệu lực phiên: 15 phút</span>
              </div>

              <button
                type="submit"
                disabled={loading || pin.length !== 6}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Đang xác thực...' : 'Mở khóa Bảng Quản lý Tiền'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Mode 2: Setup PIN */}
          {mode === 'setup' && (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-800">
                <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Bạn chưa thiết lập mã PIN bảo mật cấp 2 cho ví. Hãy đặt mã PIN 6 số để bảo vệ doanh thu và các lệnh rút tiền.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mã PIN mới (6 chữ số)</label>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  required
                  className="w-full text-center tracking-[0.5em] font-mono font-bold text-base py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mã PIN (6 chữ số)</label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  required
                  className="w-full text-center tracking-[0.5em] font-mono font-bold text-base py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || pin.length !== 6 || confirmPin.length !== 6}
                className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Lưu mã PIN & Mở khóa Ví'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Mode 3: Forgot PIN */}
          {mode === 'forgot' && (
            <form onSubmit={handleResetPin} className="space-y-3.5">
              <p className="text-xs text-slate-600 leading-relaxed">
                Mã OTP 6 số đã được gửi tới email đăng ký của bạn để xác thực chủ tài khoản trước khi đặt lại mã PIN.
              </p>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Mã OTP từ Email (6 số)</label>
                  <button
                    type="button"
                    disabled={loading || countdown > 0}
                    onClick={handleSendForgotOtp}
                    className="text-[11px] font-semibold text-amber-700 hover:underline disabled:text-slate-400 disabled:no-underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Gửi lại mã OTP'}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="w-full text-center tracking-[0.4em] font-mono font-bold text-base py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mã PIN mới (6 chữ số)</label>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  required
                  className="w-full text-center tracking-[0.5em] font-mono font-bold text-base py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mã PIN mới</label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  required
                  className="w-full text-center tracking-[0.5em] font-mono font-bold text-base py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('verify');
                    setErrorMsg(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6 || pin.length !== 6 || confirmPin.length !== 6}
                  className="flex-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : 'Đặt lại mã PIN & Mở ví'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
