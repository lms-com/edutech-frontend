import React from 'react';
import { AdminHeader } from '../components/admin/AdminHeader';
import type { PortalType, NotificationItem } from '../types';

interface AdminLayoutProps {
  currentPortal: PortalType;
  onSelectPortal: (portal: PortalType) => void;
  onOpenLearningRoom?: () => void;
  onOpenCertificate?: () => void;
  onOpenPublicVerify?: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onMarkAsRead?: (notificationId: string) => void;
  onSelectNotification?: (item: NotificationItem) => void;
  onOpenAuthModal?: () => void;
  onBackToLearner?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPortal,
  onSelectPortal,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onSelectNotification,
  onBackToLearner,
  children
}) => {
  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col font-sans">
      <AdminHeader
        currentPortal={currentPortal}
        onSelectPortal={onSelectPortal}
        notifications={notifications}
        onMarkAllAsRead={onMarkAllAsRead}
        onMarkAsRead={onMarkAsRead}
        onSelectNotification={onSelectNotification}
        onBackToLearner={onBackToLearner}
      />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
