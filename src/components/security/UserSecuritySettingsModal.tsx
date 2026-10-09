import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, KeyRound, Lock, AlertCircle, CheckCircle2, RotateCcw, X, Shield, ArrowRight 
} from 'lucide-react';
import { securityApi } from '../../api/securityApi';

interface UserSecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSecurityUpdated?: () => void;
}

export const UserSecuritySettingsModal: React.FC<UserSecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  onSecurityUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'pin' | 'password'>('pin');
  const [hasPin, setHasPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // PIN tab state
  const [pinSubTab, setPinSubTab] = useState<'change' | 'forgot'>('change');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinOtp, setPinOtp] = useState('');
  const [pinOtpCountdown, setPinOtpCountdown] = useState(0);

  // Password tab state
  const [pwdOtp, setPwdOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdOtpCountdown, setPwdOtpCountdown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadSecurityStatus();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: any;
    if (pinOtpCountdown > 0) {
      timer = setTimeout(() => setPinOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [pinOtpCountdown]);

  useEffect(() => {
    let timer: any;
    if (pwdOtpCountdown > 0) {
      timer = setTimeout(() => setPwdOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [pwdOtpCountdown]);

  const resetForm = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmNewPin('');
    setPinOtp('');
    setPwdOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const loadSecurityStatus = async () => {
    try {
      const res = await securityApi.getStatus();
      setHasPin(Boolean(res.data?.hasPin));
    } catch {
      // Ignore
    }
  };

  if (!isOpen) return null;

  // Change PIN handler
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPin.length !== 6 || newPin.length !== 6) {
      setErrorMsg('Mã PIN phải gồm đúng 6 chữ số.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setErrorMsg('Mã PIN mới xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await securityApi.changePin({ currentPin, newPin });
      setSuccessMsg('Đổi mã PIN ví thành công!');
      resetForm();
      onSecurityUpdated?.();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đổi mã PIN thất bại. Vui lòng kiểm tra mã PIN hiện tại.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot PIN OTP send
  const handleSendPinOtp = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await securityApi.sendResetPinOtp();
      setSuccessMsg('Mã OTP khôi phục PIN đã được gửi vào email của bạn.');
      setPinOtpCountdown(60);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Reset PIN with OTP handler
  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinOtp.length !== 6 || newPin.length !== 6) {
      setErrorMsg('Mã OTP và mã PIN mới phải gồm đúng 6 chữ số.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setErrorMsg('Mã PIN mới xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await securityApi.resetPin({ otp: pinOtp, newPin });
      setSuccessMsg('Đặt lại mã PIN ví thành công!');
      resetForm();
      setPinSubTab('change');
      setHasPin(true);
      onSecurityUpdated?.();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Khôi phục mã PIN thất bại. Vui lòng kiểm tra mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Send Change Password OTP
  const handleSendPwdOtp = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await securityApi.sendChangePasswordOtp();
      setSuccessMsg('Mã OTP xác thực đổi mật khẩu đã được gửi đến email của bạn.');
      setPwdOtpCountdown(60);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể gửi mã OTP đổi mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  // Change Password with OTP handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdOtp.length !== 6) {
      setErrorMsg('Vui lòng nhập đúng 6 chữ số mã OTP.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await securityApi.changePasswordWithOtp({ otp: pwdOtp, newPassword });
      setSuccessMsg('Đổi mật khẩu tài khoản thành công! Các phiên đăng nhập trên thiết bị khác đã được thu hồi.');
      resetForm();
      onSecurityUpdated?.();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Cài Đặt Bảo Mật & Xác Thực Cấp 2</h3>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                Quản lý mã PIN ví tài chính và Mật khẩu qua Email OTP
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

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('pin'); resetForm(); }}
            className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'pin'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4 text-indigo-600" />
            Mã PIN Ví Bảo Mật (Cấp 2)
          </button>
          <button
            onClick={() => { setActiveTab('password'); resetForm(); }}
            className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'password'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4 text-emerald-600" />
            Đổi Mật Khẩu (Email OTP)
          </button>
        </div>

        {/* Body */}
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

          {/* TAB 1: PIN */}
          {activeTab === 'pin' && (
            <div className="space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setPinSubTab('change'); resetForm(); }}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                    pinSubTab === 'change' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Đổi mã PIN ví
                </button>
                <button
                  type="button"
                  onClick={() => { setPinSubTab('forgot'); resetForm(); handleSendPinOtp(); }}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                    pinSubTab === 'forgot' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Quên mã PIN (Gửi OTP Email)
                </button>
              </div>

              {pinSubTab === 'change' ? (
                <form onSubmit={handleChangePin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mã PIN hiện tại (6 số)</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={currentPin}
                      onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      required
                      className="w-full text-center tracking-[0.4em] font-mono font-bold text-base py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mã PIN mới (6 số)</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      required
                      className="w-full text-center tracking-[0.4em] font-mono font-bold text-base py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mã PIN mới</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={confirmNewPin}
                      onChange={e => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      required
                      className="w-full text-center tracking-[0.4em] font-mono font-bold text-base py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || currentPin.length !== 6 || newPin.length !== 6 || confirmNewPin.length !== 6}
                    className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Đang lưu...' : 'Lưu Thay Đổi Mã PIN'}
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPin} className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Mã OTP từ Email (6 số)</label>
                      <button
                        type="button"
                        disabled={loading || pinOtpCountdown > 0}
                        onClick={handleSendPinOtp}
                        className="text-[11px] font-semibold text-indigo-600 hover:underline disabled:text-slate-400 disabled:no-underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {pinOtpCountdown > 0 ? `Gửi lại sau (${pinOtpCountdown}s)` : 'Gửi lại mã OTP'}
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={pinOtp}
                      onChange={e => setPinOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      required
                      className="w-full text-center tracking-[0.4em] font-mono font-bold text-base py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mã PIN mới (6 chữ số)</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      required
                      className="w-full text-center tracking-[0.4em] font-mono font-bold text-base py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mã PIN mới</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={confirmNewPin}
                      onChange={e => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      required
                      className="w-full text-center tracking-[0.4em] font-mono font-bold text-base py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || pinOtp.length !== 6 || newPin.length !== 6 || confirmNewPin.length !== 6}
                    className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Đang cập nhật...' : 'Xác nhận Đặt lại Mã PIN'}
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Password with OTP */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 leading-relaxed">
                Để bảo vệ an toàn cao nhất, bạn cần xác thực mã OTP gửi về Email chính chủ trước khi lưu mật khẩu mới.
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Mã OTP từ Email</label>
                  <button
                    type="button"
                    disabled={loading || pwdOtpCountdown > 0}
                    onClick={handleSendPwdOtp}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline disabled:text-slate-400 disabled:no-underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {pwdOtpCountdown > 0 ? `Gửi lại sau (${pwdOtpCountdown}s)` : 'Gửi mã OTP qua Email'}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={pwdOtp}
                  onChange={e => setPwdOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="w-full text-center tracking-[0.4em] font-mono font-bold text-base py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || pwdOtp.length !== 6 || newPassword.length < 6 || newPassword !== confirmNewPassword}
                className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Đang cập nhật...' : 'Xác nhận Đổi Mật Khẩu'}
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
