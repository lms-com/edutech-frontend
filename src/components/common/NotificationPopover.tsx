import React, { useState } from 'react';
import type { NotificationItem } from '../../types';
import { 
  Bell, Check, Award, CreditCard, ShieldCheck, X, CheckCircle2, 
  XCircle, Inbox, DollarSign, AlertTriangle, Eye, MessageSquare 
} from 'lucide-react';

interface NotificationPopoverProps {
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onMarkAsRead?: (notificationId: string) => void;
  onSelectNotification?: (item: NotificationItem) => void;
}

/**
 * Biểu tượng theo đúng enum NotificationType của backend.
 */
const getIcon = (type: string) => {
  switch (type) {
    case 'ORDER_COMPLETED':
      return <CreditCard className="w-4 h-4 text-blue-500" />;
    case 'COURSE_COMPLETED':
      return <Award className="w-4 h-4 text-emerald-500" />;
    case 'COURSE_APPROVED':
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case 'COURSE_REJECTED':
      return <XCircle className="w-4 h-4 text-rose-500" />;
    case 'PAYOUT_APPROVED':
      return <DollarSign className="w-4 h-4 text-emerald-600" />;
    case 'PAYOUT_REJECTED':
      return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    case 'OTP_SENT':
      return <ShieldCheck className="w-4 h-4 text-indigo-500" />;
    case 'LESSON_COMMENT':
      return <MessageSquare className="w-4 h-4 text-amber-500" />;
    default:
      return <Bell className="w-4 h-4 text-purple-500" />;
  }
};

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onSelectNotification
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredNotifications = filter === 'UNREAD' 
    ? notifications.filter(n => !n.isRead) 
    : notifications;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-[#2c3e50] hover:bg-slate-100 transition-colors cursor-pointer"
        title="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#e74c3c] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#2c3e50] to-[#1a252f] text-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Thông Báo Của Bạn</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#e74c3c] text-white text-[10px] font-bold">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Cập nhật tự động các hoạt động học tập & tài khoản
              </p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter tabs & Action bar */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  filter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('UNREAD')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  filter === 'UNREAD'
                    ? 'bg-white text-[#e74c3c] shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Chưa đọc ({unreadCount})
              </button>
            </div>

            <button
              onClick={onMarkAllAsRead}
              disabled={unreadCount === 0}
              className="text-[#2c3e50] hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline text-[11px]"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Đọc tất cả
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <Inbox className="w-8 h-8 text-slate-300" />
                {filter === 'UNREAD' ? 'Không có thông báo chưa đọc nào.' : 'Chưa có thông báo nào.'}
              </div>
            ) : (
              filteredNotifications.map(item => (
                <div
                  key={item.id}
                  className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 group relative ${
                    !item.isRead ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    {getIcon(item.type)}
                  </div>

                  <div 
                    onClick={() => {
                      if (!item.isRead && onMarkAsRead) onMarkAsRead(item.id);
                      if (onSelectNotification) onSelectNotification(item);
                      setIsOpen(false);
                    }}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-1 pr-6">
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

                  {/* Mark single as read button on hover */}
                  {!item.isRead && onMarkAsRead && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(item.id);
                      }}
                      className="absolute right-3 top-3 p-1 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Đánh dấu đã đọc"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Kết nối Real-time SSE (:8008) đang hoạt động
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPopover;
