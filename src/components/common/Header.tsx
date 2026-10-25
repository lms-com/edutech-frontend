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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-8">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => onSelectPortal('learner')}
          >
            <div className="w-10 h-10 rounded-xl bg-[#2c3e50] text-white flex items-center justify-center font-black text-sm shadow-md border border-[#2563eb]/30 group-hover:scale-105 transition duration-200">
              <GraduationCap className="w-6 h-6 text-[#2563eb]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-[#2c3e50]">
                  Edu<span className="text-[#2563eb]">Tech</span>
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
              <BookOpen className={`w-4 h-4 ${currentPortal === 'learner' ? 'text-indigo-600' : 'text-slate-400'}`} />
              Khóa học
            </button>

            {showInstructorPortal && (
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
            )}

            {showAdminPortal && (
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
            )}
          </nav>
        </div>

        {/* Right: Quick Action CTAs & Profile */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Nút Hướng dẫn sử dụng toàn diện */}
          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#2c3e50] hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-200/60 shadow-2xs"
            title="Xem hướng dẫn sử dụng chi tiết dành cho học viên và giảng viên"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span>Hướng dẫn</span>
          </button>

          {/* Quick Certificate Verify Link */}
          {showPublicCertificateLookup && <button
            onClick={onOpenPublicVerify}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#2c3e50] hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Tra cứu chứng chỉ công khai bằng mã QR"
          >
            <QrCode className="w-4 h-4 text-slate-500" />
            <span>Tra cứu chứng chỉ</span>
          </button>}

          {/* Notification Popover */}
          <NotificationPopover
            notifications={notifications}
            onMarkAllAsRead={onMarkAllAsRead}
            onSelectNotification={onSelectNotification}
            onMarkAsRead={onMarkAsRead}
          />

          {/* User Profile avatar or Login CTA */}
          {isAuthenticated && user ? (
            <div ref={dropdownRef} className="relative pl-2 border-l border-slate-200 user-profile-menu-container">
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
                  <span className="text-[10px] text-slate-400 font-medium">
                    {primaryRoleLabel(user.roles)}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User info banner */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#2c3e50] text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{user.fullName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-1 text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                        {primaryRoleLabel(user.roles)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
            <div className="pl-2 border-l border-slate-200 flex items-center gap-2">
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-sm transition-all cursor-pointer"
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

        {showInstructorPortal && (
          <button
            onClick={() => onSelectPortal('instructor')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
              currentPortal === 'instructor' ? 'bg-[#2c3e50] text-white' : 'text-slate-600'
            }`}
          >
            <Video className="w-4 h-4" />
            Giảng dạy
          </button>
        )}

        {showAdminPortal && (
          <button
            onClick={() => onSelectPortal('admin')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
              currentPortal === 'admin' ? 'bg-[#2c3e50] text-white' : 'text-slate-600'
            }`}
          >
            <Shield className="w-4 h-4" />
            Quản trị
          </button>
        )}

        {showPublicCertificateLookup && (
        <button
          onClick={onOpenPublicVerify}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900"
        >
          <QrCode className="w-4 h-4" />
          Tra cứu
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
