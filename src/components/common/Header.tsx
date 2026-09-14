import React, { useState, useEffect } from 'react';
import type { PortalType, NotificationItem } from '../../types';
import { NotificationPopover } from './NotificationPopover';
import { useAuthStore } from '../../stores/useAuthStore';
import { getDeviceFingerprint } from '../../utils/fingerprint';
import { 
  GraduationCap, 
  Video, 
  Shield, 
  Award, 
  QrCode, 
  PlayCircle,
  LogIn,
  LogOut,
  Laptop
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
  onOpenLearningRoom,
  onOpenCertificate,
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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm print:hidden">
      {/* Top micro-service banner */}
      <div className="bg-[#2c3e50] text-slate-200 px-4 py-1 text-[11px] flex items-center justify-between font-mono">
        <div className="flex items-center gap-2 truncate">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-semibold text-white">API GATEWAY (:8080)</span>
          <span className="text-slate-400 hidden sm:inline">• Reverse Proxy & JWT RBAC Active</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenCertificate}
            className="text-amber-300 hover:text-white flex items-center gap-1 font-sans text-xs transition-colors cursor-pointer"
            title="Mở xem khung chứng chỉ A4 hoàn thành"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Xem Chứng Chỉ A4</span>
          </button>
          <span className="text-slate-600 hidden md:inline">|</span>
          <button
            onClick={onOpenPublicVerify}
            className="text-emerald-300 hover:text-white flex items-center gap-1 font-sans text-xs transition-colors cursor-pointer"
            title="Mở trang quét QR xác thực công khai"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Xác thực QR Công khai</span>
          </button>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Title */}
        <div 
          className="flex items-center gap-3 shrink-0 cursor-pointer" 
          onClick={() => onSelectPortal('learner')}
        >
          <div className="w-9 h-9 rounded-xl bg-[#2c3e50] text-white flex items-center justify-center font-black text-sm shadow-md border border-[#e74c3c]/40">
            ET
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base md:text-lg tracking-tight text-[#2c3e50]">EduTech</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-[#e74c3c]/10 text-[#e74c3c]">
                LMS
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Microservices Architecture</p>
          </div>
        </div>

        {/* Center: 3 Portals Switcher */}
        <div className="hidden lg:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => onSelectPortal('learner')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              currentPortal === 'learner'
                ? 'bg-white text-[#2c3e50] shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${currentPortal === 'learner' ? 'text-[#e74c3c]' : 'text-slate-500'}`} />
            Học viên (Learner)
          </button>

          <button
            onClick={() => onSelectPortal('instructor')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              currentPortal === 'instructor'
                ? 'bg-white text-[#2c3e50] shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className={`w-4 h-4 ${currentPortal === 'instructor' ? 'text-indigo-600' : 'text-slate-500'}`} />
            Giảng viên (Studio)
          </button>

          <button
            onClick={() => onSelectPortal('admin')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              currentPortal === 'admin'
                ? 'bg-white text-[#2c3e50] shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className={`w-4 h-4 ${currentPortal === 'admin' ? 'text-emerald-600' : 'text-slate-500'}`} />
            Quản trị (Admin)
          </button>
        </div>

        {/* Right: Quick Action CTAs & Profile */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Direct CTA to Learning Room */}
          <button
            onClick={onOpenLearningRoom}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#2c3e50] hover:bg-[#1a252f] text-white shadow-sm transition-all hover:scale-105 cursor-pointer"
            title="Vào ngay phòng học Cinema Mode để trải nghiệm video HLS AES-128"
          >
            <PlayCircle className="w-4 h-4 text-[#e74c3c]" />
            <span>Vào Phòng Học</span>
          </button>

          {/* Quick Certificate View Button */}
          <button
            onClick={onOpenCertificate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#e74c3c] hover:bg-[#c0392b] text-white shadow-sm transition-all cursor-pointer"
            title="Xem nhanh chứng chỉ tốt nghiệp chuẩn A4"
          >
            <Award className="w-4 h-4 text-amber-200" />
            <span className="hidden sm:inline">Chứng Chỉ</span>
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
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-[#2c3e50] text-white font-bold flex items-center justify-center text-xs shadow-sm ring-2 ring-slate-200">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden xl:block text-left text-xs leading-tight">
                  <p className="font-bold text-[#2c3e50] truncate max-w-[120px]">{user.fullName || user.email}</p>
                  <span className="text-[10px] text-slate-500 font-mono uppercase">
                    {user.roles?.[0] || 'LEARNER'}
                  </span>
                </div>
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-[#2c3e50] truncate">{user.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                      <Laptop className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate">FP: {fingerprint || 'Active'}</span>
                    </div>
                  </div>

                  <div className="py-1 border-b border-slate-100 text-xs">
                    <button
                      onClick={() => { setProfileDropdownOpen(false); onSelectPortal('learner'); }}
                      className="w-full px-4 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-[#e74c3c]" />
                      Chuyển sang Học viên
                    </button>
                    <button
                      onClick={() => { setProfileDropdownOpen(false); onSelectPortal('instructor'); }}
                      className="w-full px-4 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5 text-indigo-600" />
                      Chuyển sang Giảng viên
                    </button>
                    <button
                      onClick={() => { setProfileDropdownOpen(false); onSelectPortal('admin'); }}
                      className="w-full px-4 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      Chuyển sang Quản trị
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Đăng xuất khỏi thiết bị
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="pl-2 border-l border-slate-200">
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-[#2c3e50] border border-slate-300 shadow-xs transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-[#e74c3c]" />
                <span>Đăng nhập</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Portal Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-200 py-1.5 bg-slate-50 text-[11px] font-bold">
        <button
          onClick={() => onSelectPortal('learner')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${
            currentPortal === 'learner' ? 'bg-[#2c3e50] text-white' : 'text-slate-600'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Học viên
        </button>

        <button
          onClick={() => onSelectPortal('instructor')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${
            currentPortal === 'instructor' ? 'bg-[#2c3e50] text-white' : 'text-slate-600'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          Giảng viên
        </button>

        <button
          onClick={() => onSelectPortal('admin')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${
            currentPortal === 'admin' ? 'bg-[#2c3e50] text-white' : 'text-slate-600'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Admin
        </button>

        <button
          onClick={onOpenLearningRoom}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#e74c3c] text-white"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          Vào học
        </button>
      </div>
    </header>
  );
};
