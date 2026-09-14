import React, { useState } from 'react';
import { NotificationItem } from '../../types';
import { Bell, Check, Award, CreditCard, Video, ShieldCheck, Sparkles, X } from 'lucide-react';

interface NotificationPopoverProps {
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onSelectNotification?: (item: NotificationItem) => void;
  onSimulateNewSSEEvent: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  notifications,
  onMarkAllAsRead,
  onSelectNotification,
  onSimulateNewSSEEvent
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'CERTIFICATE':
        return <Award className="w-4 h-4 text-emerald-500" />;
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'VIDEO_PROCESSED':
        return <Video className="w-4 h-4 text-amber-500" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-[#2c3e50] hover:bg-slate-100 transition-colors"
        title="Trung tâm thông báo thời gian thực (SSE Stream)"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#e74c3c] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-4 bg-gradient-to-r from-[#2c3e50] to-[#34495e] text-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm">Thông Báo Hệ Thống</h3>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200 text-[10px] font-mono">
                  SSE LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {unreadCount > 0 ? `${unreadCount} thông báo mới chưa đọc` : 'Không có thông báo mới'}
              </p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action bar */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <button
              onClick={onMarkAllAsRead}
              className="text-[#2c3e50] hover:underline font-semibold flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Đánh dấu tất cả là đã đọc
            </button>

            <button
              onClick={onSimulateNewSSEEvent}
              className="text-[#e74c3c] hover:underline font-semibold flex items-center gap-1"
              title="Bắn một sự kiện Server-Sent Events mô phỏng từ backend"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Mô phỏng SSE
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  if (onSelectNotification) onSelectNotification(item);
                  setIsOpen(false);
                }}
                className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                  !item.isRead ? 'bg-amber-50/40' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  {getIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`text-xs font-bold leading-tight ${!item.isRead ? 'text-[#2c3e50]' : 'text-slate-700'}`}>
                      {item.title}
                    </h4>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#e74c3c] shrink-0"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug line-clamp-2">
                    {item.message}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1.5 block">
                    {item.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <span className="text-[10px] font-mono text-slate-400">
              Notification-service:8084 SSE Stream Subscribed
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
