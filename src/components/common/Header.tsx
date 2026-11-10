import React, { useState, useEffect, useRef } from 'react';
import type { PortalType, NotificationItem } from '../../types';
import { NotificationPopover } from './NotificationPopover';
import { useAuthStore } from '../../stores/useAuthStore';
import { getDeviceFingerprint } from '../../utils/fingerprint';
import { canAccessPortal, primaryRoleLabel } from '../../utils/roles';
import { 
  GraduationCap, 
  Video, 
  Shield, 
  QrCode, 
  LogIn,
  LogOut,
  Laptop,
  BookOpen,
  ChevronDown,
  ShoppingBag,
  KeyRound,
  Lock,
  ShieldCheck,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { UserSecuritySettingsModal } from '../security/UserSecuritySettingsModal';
import { UserGuideModal } from './UserGuideModal';
import { ApplyInstructorModal } from '../instructor/ApplyInstructorModal';

interface HeaderProps {
  currentPortal: PortalType;
  onSelectPortal: (portal: PortalType) => void;
  onOpenLearningRoom: () => void;
  onOpenCertificate: () => void;
  onOpenPublicVerify: () => void;
  onOpenOrderHistory?: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onMarkAsRead?: (notificationId: string) => void;
  onSelectNotification?: (item: NotificationItem) => void;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPortal,
  onSelectPortal,
  onOpenPublicVerify,
  onOpenOrderHistory,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onSelectNotification,
  onOpenAuthModal
}) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [fingerprint, setFingerprint] = useState<string>('');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityInitialTab, setSecurityInitialTab] = useState<'pin' | 'password'>('password');
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isApplyInstructorOpen, setIsApplyInstructorOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Chỉ hiện lối vào những portal mà vai trò hiện tại được phép dùng
  const showInstructorPortal = canAccessPortal(user?.roles, 'instructor');
  const showAdminPortal = canAccessPortal(user?.roles, 'admin');
  // QR verification is a public lookup feature for learners/visitors. Staff can
  // still open a verification link directly, but it should not clutter their workspaces.
  const showPublicCertificateLookup = currentPortal === 'learner';

  useEffect(() => {
    getDeviceFingerprint().then(fp => setFingerprint(fp));
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    onSelectPortal('learner');
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-2xs print:hidden transition-all">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-6 lg:gap-8">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => onSelectPortal('learner')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-700 via-blue-600 to-sky-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-600/20 group-hover:scale-105 group-hover:shadow-indigo-600/30 transition-all duration-300">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-slate-900">
                  Edu<span className="text-blue-600">Tech</span>
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200/60 uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:block">
                Nền tảng Đào tạo Chuyên sâu
              </span>
            </div>
          </div>

          {/* Primary Navigation Capsule Switcher */}
          <nav className="hidden md:flex items-center p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 text-xs font-bold gap-1">
            <button
              onClick={() => onSelectPortal('learner')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                currentPortal === 'learner'
                  ? 'bg-white text-slate-900 font-extrabold shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${currentPortal === 'learner' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Khóa học</span>
            </button>

            {showInstructorPortal && (
              <button
                onClick={() => onSelectPortal('instructor')}
                className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  currentPortal === 'instructor'
                    ? 'bg-white text-slate-900 font-extrabold shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Video className={`w-3.5 h-3.5 ${currentPortal === 'instructor' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>Giảng dạy</span>
              </button>
            )}

            {showAdminPortal && (
              <button
                onClick={() => onSelectPortal('admin')}
                className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  currentPortal === 'admin'
                    ? 'bg-white text-slate-900 font-extrabold shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Shield className={`w-3.5 h-3.5 ${currentPortal === 'admin' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Quản trị</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right: Quick Action CTAs & Profile */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Nút Hướng dẫn sử dụng toàn diện */}
          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-200/80 shadow-2xs hover:border-slate-300"
            title="Xem hướng dẫn sử dụng chi tiết dành cho học viên và giảng viên"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Hướng dẫn</span>
          </button>

          {/* Quick Certificate Verify Link */}
          {showPublicCertificateLookup && (
            <button
              onClick={onOpenPublicVerify}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-200/80 shadow-2xs hover:border-slate-300"
              title="Tra cứu chứng chỉ công khai bằng mã QR"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-500" />
              <span>Tra cứu chứng chỉ</span>
            </button>
          )}

          {/* Notification Popover */}
          <NotificationPopover
            notifications={notifications}
            onMarkAllAsRead={onMarkAllAsRead}
            onSelectNotification={onSelectNotification}
            onMarkAsRead={onMarkAsRead}
          />

          {/* User Profile avatar or Login CTA */}
          {isAuthenticated && user ? (
            <div ref={dropdownRef} className="relative pl-2 border-l border-slate-200/80 user-profile-menu-container">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-2xl hover:bg-slate-100/80 transition-all cursor-pointer text-left border border-transparent hover:border-slate-200 shadow-2xs"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-900 text-white font-black flex items-center justify-center text-xs shadow-xs ring-2 ring-indigo-500/20">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                    {user.fullName || user.email}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {primaryRoleLabel(user.roles)}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User info banner */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-indigo-50/30">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-900 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0 ring-2 ring-indigo-500/20">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-1 text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80">
                        {primaryRoleLabel(user.roles)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Thiết bị bảo mật
                      </span>
                    </div>
                  </div>

                  {/* Section 1: Workspaces */}
                  <div className="py-1 border-b border-slate-100 text-xs font-medium">
                    <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Không gian làm việc
                    </div>
                    <button
                      onClick={() => { setProfileDropdownOpen(false); onSelectPortal('learner'); }}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-[#2563eb]" />
                      Trang Học viên
                    </button>
                    {onOpenOrderHistory && (
                      <button
                        onClick={() => { setProfileDropdownOpen(false); onOpenOrderHistory(); }}
                        className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4 text-amber-500" />
                        Lịch sử đơn hàng
                      </button>
                    )}
                    {showInstructorPortal ? (
                      <button
                        onClick={() => { setProfileDropdownOpen(false); onSelectPortal('instructor'); }}
                        className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <Video className="w-4 h-4 text-indigo-600" />
                        Studio Giảng viên
                      </button>
                    ) : (
                      <button
                        onClick={() => { setProfileDropdownOpen(false); setIsApplyInstructorOpen(true); }}
                        className="w-full px-4 py-2 text-left text-indigo-700 hover:bg-indigo-50/70 flex items-center gap-2.5 transition cursor-pointer font-bold"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        Đăng ký làm Giảng viên
                      </button>
                    )}
                    {showAdminPortal && (
                      <button
                        onClick={() => { setProfileDropdownOpen(false); onSelectPortal('admin'); }}
                        className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-emerald-600" />
                        Cổng Quản trị Hệ thống
                      </button>
                    )}
                  </div>

                  {/* Section 2: Security & Password Settings */}
                  <div className="py-1 border-b border-slate-100 text-xs font-medium">
                    <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Bảo mật & Cài đặt
                    </div>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setSecurityInitialTab('password');
                        setIsSecurityModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800 flex items-center gap-2.5 transition cursor-pointer group"
                    >
                      <Lock className="w-4 h-4 text-emerald-600 group-hover:scale-105 transition-transform" />
                      <div className="flex-1">
                        <span className="font-semibold block">Đổi mật khẩu (Email OTP)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Xác thực OTP qua email an toàn</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setSecurityInitialTab('pin');
                        setIsSecurityModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-amber-50/70 hover:text-amber-800 flex items-center gap-2.5 transition cursor-pointer group"
                    >
                      <KeyRound className="w-4 h-4 text-amber-600 group-hover:scale-105 transition-transform" />
                      <div className="flex-1">
                        <span className="font-semibold block">Mã PIN bảo mật ví (Cấp 2)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Khóa ví & xác thực rút tiền</span>
                      </div>
                    </button>
                  </div>

                  {/* Section 3: Logout */}
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
            <div className="pl-2 border-l border-slate-200/80 flex items-center gap-2">
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200/80 py-2 bg-white/95 backdrop-blur text-[11px] font-bold">
        <button
          onClick={() => onSelectPortal('learner')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
            currentPortal === 'learner' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Khóa học</span>
        </button>

        {showInstructorPortal && (
          <button
            onClick={() => onSelectPortal('instructor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              currentPortal === 'instructor' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Giảng dạy</span>
          </button>
        )}

        {showAdminPortal && (
          <button
            onClick={() => onSelectPortal('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              currentPortal === 'admin' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Quản trị</span>
          </button>
        )}

        {showPublicCertificateLookup && (
          <button
            onClick={onOpenPublicVerify}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900"
          >
            <QrCode className="w-4 h-4" />
            <span>Tra cứu</span>
          </button>
        )}
      </div>

      {/* Global Security Settings Modal (Password & PIN) */}
      <UserSecuritySettingsModal
        isOpen={isSecurityModalOpen}
        initialTab={securityInitialTab}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      {/* Global User Guide Modal */}
      <UserGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        defaultRole={canAccessPortal(user?.roles, 'instructor') ? 'instructor' : 'learner'}
      />

      {/* Modal nộp đơn làm giảng viên */}
      <ApplyInstructorModal
        isOpen={isApplyInstructorOpen}
        onClose={() => setIsApplyInstructorOpen(false)}
        onSuccess={() => {
          // Callback sau khi nộp thành công
        }}
      />
    </header>
  );
};
