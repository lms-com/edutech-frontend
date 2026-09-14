import React, { useState, useEffect } from 'react';
import { 
  X, LogIn, UserPlus, Laptop, Lock, Mail, User as UserIcon, 
  AlertCircle, CheckCircle2, Sparkles, ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { authApi } from '../../api/authApi';
import { getDeviceFingerprint } from '../../utils/fingerprint';
import type { PortalType } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (portal?: PortalType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string>('');

  const { setAuth } = useAuthStore();

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

    try {
      // 1. Thử gọi API thực tế tới Backend qua API Gateway (:8080)
      const res = await authApi.login({ email, password });
      if (res && res.data) {
        const { accessToken, userId, email: userEmail, permissions } = res.data;
        const userObj = {
          id: userId,
          email: userEmail,
          fullName: userEmail.split('@')[0],
          roles: permissions || ['LEARNER']
        };
        setAuth(userObj, accessToken);
        setSuccessMsg('Đăng nhập thành công qua API Gateway!');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess('learner');
        }, 600);
        return;
      }
    } catch (err: any) {
      // Nếu Backend chưa bật hoặc lỗi kết nối, hiển thị gợi ý và hỗ trợ fallback demo
      console.warn('API Gateway offline hoặc đăng nhập thất bại:', err);
      const isGatewayDown = !err.response || err.code === 'ERR_NETWORK';
      
      if (isGatewayDown) {
        // Fallback login cho môi trường phát triển cục bộ khi backend chưa khởi động
        const mockUser = {
          id: `usr_${Math.random().toString(36).substring(2, 8)}`,
          email: email,
          fullName: email.includes('admin') ? 'Quản Trị Viên Hệ Thống' : email.includes('khoa') ? 'TS. Trần Minh Khoa' : 'Nguyễn Hoàng Long',
          roles: email.includes('admin') ? ['ADMIN'] : email.includes('khoa') ? ['INSTRUCTOR'] : ['LEARNER']
        };
        setAuth(mockUser, `mock_jwt_token_${Date.now()}`);
        setSuccessMsg('Đăng nhập chế độ Demo thành công (Backend Gateway offline)!');
        setTimeout(() => {
          onClose();
          if (onSuccess) {
            if (mockUser.roles.includes('ADMIN')) onSuccess('admin');
            else if (mockUser.roles.includes('INSTRUCTOR')) onSuccess('instructor');
            else onSuccess('learner');
          }
        }, 600);
        return;
      }

      setErrorMsg(err.response?.data?.message || 'Đăng nhập không thành công. Kiểm tra lại thông tin.');
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

    try {
      const res = await authApi.register({ email, password, fullName });
      if (res && res.data) {
        setSuccessMsg('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
        setTab('login');
      }
    } catch (err: any) {
      const isGatewayDown = !err.response || err.code === 'ERR_NETWORK';
      if (isGatewayDown) {
        setSuccessMsg('Đăng ký thành công (Demo Mode). Hãy chuyển sang đăng nhập.');
        setTab('login');
        return;
      }
      setErrorMsg(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Account Selection
  const handleSelectDemo = (role: 'LEARNER' | 'INSTRUCTOR' | 'ADMIN') => {
    let mockUser;
    let targetPortal: PortalType = 'learner';

    if (role === 'LEARNER') {
      mockUser = {
        id: 'usr_vn_9824',
        email: 'long.nguyen@edutech.vn',
        fullName: 'Nguyễn Hoàng Long',
        roles: ['LEARNER']
      };
      targetPortal = 'learner';
    } else if (role === 'INSTRUCTOR') {
      mockUser = {
        id: 'inst_01',
        email: 'khoa.tran@edutech.vn',
        fullName: 'TS. Trần Minh Khoa',
        roles: ['INSTRUCTOR']
      };
      targetPortal = 'instructor';
    } else {
      mockUser = {
        id: 'adm_01',
        email: 'admin@edutech.vn',
        fullName: 'Quản Trị Viên Hệ Thống',
        roles: ['ADMIN']
      };
      targetPortal = 'admin';
    }

    setAuth(mockUser, `demo_jwt_token_${role.toLowerCase()}`);
    setSuccessMsg(`Đã đăng nhập nhanh với vai trò ${role}!`);
    setTimeout(() => {
      onClose();
      if (onSuccess) onSuccess(targetPortal);
    }, 500);
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

          {/* Quick Demo Switcher Section */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Đăng nhập nhanh (Tài khoản mẫu)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectDemo('LEARNER')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
              >
                <div className="text-[11px] font-bold text-[#2c3e50]">Học viên</div>
                <div className="text-[10px] text-slate-400">Hoàng Long</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemo('INSTRUCTOR')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
              >
                <div className="text-[11px] font-bold text-indigo-700">Giảng viên</div>
                <div className="text-[10px] text-slate-400">TS. Minh Khoa</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemo('ADMIN')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
              >
                <div className="text-[11px] font-bold text-emerald-700">Quản trị</div>
                <div className="text-[10px] text-slate-400">Admin System</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
