import React, { useState } from 'react';
import type { PortalType, NotificationItem } from '../../types';
import { useAuthStore } from '../../stores/useAuthStore';
import { NotificationPopover } from '../common/NotificationPopover';
import { 
  Shield, 
  ArrowLeft, 
  LogOut, 
  Laptop, 
  Activity, 
  ChevronDown 
} from 'lucide-react';

interface AdminHeaderProps {
  currentPortal: PortalType;
  onSelectPortal: (portal: PortalType) => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onMarkAsRead?: (notificationId: string) => void;
  onSelectNotification?: (item: NotificationItem) => void;
  onBackToLearner?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onSelectPortal,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onSelectNotification,
  onBackToLearner,
}) => {
  const { user, logout } = useAuthStore();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
  };

  const handleReturnToLearner = () => {
    if (onBackToLearner) {
      onBackToLearner();
    } else {
      onSelectPortal('learner');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0f172a] text-slate-100 border-b border-slate-800 shadow-md print:hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Dedicated Admin Console Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-900/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Edu<span className="text-emerald-400">Tech</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                Admin Console
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Hệ thống Kiểm duyệt & Quản trị Vận hành Trung tâm
            </p>
          </div>
        </div>

        {/* Right: System status, Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* System Status Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Activity className="w-3 h-3 text-slate-400" />
            <span>Hệ thống: Bình thường</span>
          </div>

          {/* Notifications Popover */}
          <div className="text-slate-700">
            <NotificationPopover
              notifications={notifications}
              onMarkAllAsRead={onMarkAllAsRead}
              onSelectNotification={onSelectNotification}
              onMarkAsRead={onMarkAsRead}
            />
          </div>

          {/* Quick Return to Learner Portal */}
          <button
            onClick={handleReturnToLearner}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer"
            title="Rời khỏi trang quản trị về trang học viên"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Về trang học viên</span>
          </button>

          {/* Admin Profile Dropdown */}
          <div className="relative pl-2 border-l border-slate-700">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 pr-2 rounded-xl hover:bg-slate-800 transition cursor-pointer text-left border border-transparent hover:border-slate-700"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-100 truncate max-w-[130px]">
                  {user?.fullName || user?.email || 'Quản trị viên'}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-medium">
                  SUPER_ADMIN
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 text-slate-200 rounded-2xl shadow-2xl border border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-800">
                  <p className="text-xs font-bold text-white truncate">{user?.fullName || 'Administrator'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-emerald-300 bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-800/40">
                    <Laptop className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Phiên bảo mật Quản trị viên</span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleReturnToLearner}
                    className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-400" />
                    Chuyển sang Giao diện Học viên
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 flex items-center gap-2 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất quản trị
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
