import React, { useState, useEffect } from 'react';
import type { PortalType, NotificationItem } from '../../types';
import { NotificationPopover } from './NotificationPopover';
import { useAuthStore } from '../../stores/useAuthStore';
import { getDeviceFingerprint } from '../../utils/fingerprint';
import { 
  GraduationCap, 
  Video, 
  Shield, 
  QrCode, 
  LogIn,
  LogOut,
  Laptop,
  BookOpen,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  currentPortal: PortalType;
  onSelectPortal: (portal: PortalType) => void;
  onOpenLearningRoom: () => void;
  onOpenCertificate: () => void;
  onOpenPublicVerify: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onSimulateSSE: () => void;
  onSelectNotification?: (item: NotificationItem) => void;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPortal,
  onSelectPortal,
  onOpenPublicVerify,
  notifications,
  onMarkAllAsRead,
  onSimulateSSE,
  onSelectNotification,
  onOpenAuthModal
}) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [fingerprint, setFingerprint] = useState<string>('');

  useEffect(() => {
    getDeviceFingerprint().then(fp => setFingerprint(fp));
  }, []);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-8">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => onSelectPortal('learner')}
          >
            <div className="w-10 h-10 rounded-xl bg-[#2c3e50] text-white flex items-center justify-center font-black text-sm shadow-md border border-[#e74c3c]/30 group-hover:scale-105 transition duration-200">
              <GraduationCap className="w-6 h-6 text-[#e74c3c]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-[#2c3e50]">
                  Edu<span className="text-[#e74c3c]">Tech</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                  LMS
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:block">
                Nền tảng Đào tạo Chuyên sâu
              </span>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => onSelectPortal('learner')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                currentPortal === 'learner'
                  ? 'bg-slate-100 text-[#2c3e50] font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${currentPortal === 'learner' ? 'text-[#e74c3c]' : 'text-slate-400'}`} />
              Khóa học
            </button>

            <button
              onClick={() => onSelectPortal('instructor')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                currentPortal === 'instructor'
                  ? 'bg-slate-100 text-[#2c3e50] font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Video className={`w-4 h-4 ${currentPortal === 'instructor' ? 'text-indigo-600' : 'text-slate-400'}`} />
              Giảng dạy
            </button>

            <button
              onClick={() => onSelectPortal('admin')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                currentPortal === 'admin'
                  ? 'bg-slate-100 text-[#2c3e50] font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Shield className={`w-4 h-4 ${currentPortal === 'admin' ? 'text-emerald-600' : 'text-slate-400'}`} />
              Quản trị
            </button>
          </nav>
        </div>

        {/* Right: Quick Action CTAs & Profile */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Quick Certificate Verify Link */}
          <button
            onClick={onOpenPublicVerify}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#2c3e50] hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Tra cứu chứng chỉ số hóa qua mã băm QR"
          >
            <QrCode className="w-4 h-4 text-slate-500" />
            <span>Xác thực Chứng chỉ</span>
          </button>

          {/* Notification Popover */}
          <NotificationPopover
            notifications={notifications}
            onMarkAllAsRead={onMarkAllAsRead}
            onSelectNotification={onSelectNotification}
            onSimulateNewSSEEvent={onSimulateSSE}
          />

          {/* User Profile avatar or Login CTA */}
          {isAuthenticated && user ? (
            <div className="relative pl-2 border-l border-slate-200">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition cursor-pointer text-left border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-xl bg-[#2c3e50] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#2c3e50] truncate max-w-[120px]">
                    {user.fullName || user.email}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium capitalize">
                    {user.roles?.[0]?.toLowerCase() || 'học viên'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-[#2c3e50] truncate">{user.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                      <Laptop className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate">Thiết bị: {fingerprint.substring(0, 16) || 'Đang bảo mật'}...</span>
                    </div>
                  </div>

                  <div className="py-1 border-b border-slate-100 text-xs font-medium">
                    <button
                      onClick={() => { setProfileDropdownOpen(false); onSelectPortal('learner'); }}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-[#e74c3c]" />
                      Trang Học viên
                    </button>
                    <button
                      onClick={() => { setProfileDropdownOpen(false); onSelectPortal('instructor'); }}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Video className="w-4 h-4 text-indigo-600" />
                      Studio Giảng viên
                    </button>
                    <button
                      onClick={() => { setProfileDropdownOpen(false); onSelectPortal('admin'); }}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-emerald-600" />
                      Cổng Quản trị Hệ thống
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất khỏi thiết bị
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="pl-2 border-l border-slate-200 flex items-center gap-2">
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#e74c3c] hover:bg-[#c0392b] text-white shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 py-2 bg-white text-[11px] font-bold">
        <button
          onClick={() => onSelectPortal('learner')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
            currentPortal === 'learner' ? 'bg-[#2c3e50] text-white' : 'text-slate-600'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Khóa học
        </button>

        <button
          onClick={() => onSelectPortal('instructor')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
            currentPortal === 'instructor' ? 'bg-[#2c3e50] text-white' : 'text-slate-600'
          }`}
        >
          <Video className="w-4 h-4" />
          Giảng dạy
        </button>

        <button
          onClick={() => onSelectPortal('admin')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
            currentPortal === 'admin' ? 'bg-[#2c3e50] text-white' : 'text-slate-600'
          }`}
        >
          <Shield className="w-4 h-4" />
          Quản trị
        </button>

        <button
          onClick={onOpenPublicVerify}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900"
        >
          <QrCode className="w-4 h-4" />
          Xác thực
        </button>
      </div>
    </header>
  );
};
