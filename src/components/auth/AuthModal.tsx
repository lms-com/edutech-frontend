import React, { useState, useEffect } from 'react';
import { 
  X, LogIn, UserPlus, Laptop, Lock, Mail, User as UserIcon, 
  AlertCircle, CheckCircle2, ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { authApi } from '../../api/authApi';
import { getDeviceFingerprint } from '../../utils/fingerprint';
import { landingPortal, primaryRoleLabel } from '../../utils/roles';
import type { PortalType } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (portal?: PortalType) => void;
}

// Mã lỗi nghiệp vụ do IAM trả về (ApiResponse.code) -> thông báo tiếng Việt
const AUTH_ERROR_MESSAGES: Record<number, string> = {
  2001: 'Email này chưa được đăng ký.',
  2002: 'Mật khẩu không đúng.',
  2003: 'Email này đã được sử dụng.',
  2004: 'Mật khẩu không hợp lệ.',
  2006: 'Không lấy được dấu vân tay thiết bị. Vui lòng tải lại trang.',
  2008: 'Hệ thống chưa cấu hình vai trò mặc định. Liên hệ quản trị viên.',
  2014: 'Tài khoản đang bị khoá.',
  2015: 'Tài khoản đã bị vô hiệu hoá.',
};

/**
 * axiosClient reject bằng body ApiResponse (đã bỏ lớp AxiosError) nên thông báo
 * thật nằm ở err.message, còn lỗi mạng thì giữ nguyên AxiosError.
 */
const describeAuthError = (err: any, fallback: string): string => {
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'Không kết nối được API Gateway (http://localhost:8080). Kiểm tra backend đã chạy chưa.';
  }
  if (typeof err?.code === 'number' && AUTH_ERROR_MESSAGES[err.code]) {
    return AUTH_ERROR_MESSAGES[err.code];
  }
  if (typeof err?.message === 'string' && err.message.trim()) {
    return err.message;
  }
  return fallback;
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string>('');

  const { setToken, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      getDeviceFingerprint().then(fp => setFingerprint(fp));
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await authApi.login({ email, password });
      const accessToken = res?.data?.accessToken;
      if (!accessToken) {
        setErrorMsg('Máy chủ không trả về token đăng nhập.');
        return;
      }

      // Lưu token trước để /user/me gọi được, rồi lấy hồ sơ thật (fullName + roles)
      setToken(accessToken);
      const profile = await fetchCurrentUser();
      if (!profile) {
        setErrorMsg('Đăng nhập thành công nhưng không đọc được hồ sơ người dùng. Vui lòng thử lại.');
        return;
      }

      const targetPortal = landingPortal(profile.roles);
      setSuccessMsg(`Xin chào ${profile.fullName} — vai trò ${primaryRoleLabel(profile.roles)}.`);
      setTimeout(() => {
        onClose();
        onSuccess?.(targetPortal);
      }, 600);
    } catch (err: any) {
      setErrorMsg(describeAuthError(err, 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setErrorMsg('Vui lòng điền đầy đủ họ tên, email và mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await authApi.register({ email, password, fullName });
      if (!res?.data) {
        setErrorMsg('Máy chủ không xác nhận được việc tạo tài khoản.');
        return;
      }
      setSuccessMsg('Đăng ký thành công! Hãy đăng nhập bằng tài khoản vừa tạo.');
      setTab('login');
    } catch (err: any) {
      setErrorMsg(describeAuthError(err, 'Đăng ký thất bại. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header bar */}
        <div className="bg-gradient-to-r from-[#2c3e50] to-[#1a252f] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#e74c3c] font-black border border-white/20">
              ET
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">EduTech IAM Authentication</h3>
              <p className="text-[11px] text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Spring Security & Gateway (:8080)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => { setTab('login'); setErrorMsg(null); }}
            className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition ${
              tab === 'login'
                ? 'border-[#e74c3c] text-[#2c3e50] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4 text-[#e74c3c]" />
            Đăng nhập
          </button>
          <button
            onClick={() => { setTab('register'); setErrorMsg(null); }}
            className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition ${
              tab === 'register'
                ? 'border-[#e74c3c] text-[#2c3e50] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4 text-indigo-600" />
            Đăng ký tài khoản
          </button>
        </div>

        {/* Device Fingerprint Badge */}
        <div className="px-6 pt-4">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 text-slate-600">
              <Laptop className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="font-medium">Device Fingerprint:</span>
            </div>
            <span className="font-mono text-slate-700 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 max-w-[170px] truncate" title={fingerprint}>
              {fingerprint || 'Đang tạo...'}
            </span>
          </div>
        </div>

        {/* Form area */}
        <div className="p-6 pt-4">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="learner@edutech.vn"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e74c3c]/30 focus:border-[#e74c3c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e74c3c]/30 focus:border-[#e74c3c]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e74c3c]/30 focus:border-[#e74c3c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e74c3c]/30 focus:border-[#e74c3c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Ít nhất 8 ký tự"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e74c3c]/30 focus:border-[#e74c3c]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-[#2c3e50] hover:bg-[#1a252f] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? 'Đang đăng ký...' : 'Tạo tài khoản mới'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
