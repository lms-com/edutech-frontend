import React from 'react';
import { Header } from '../components/common/Header';
import type { PortalType, NotificationItem } from '../types';

interface AdminLayoutProps {
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
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPortal,
  onSelectPortal,
  onOpenLearningRoom,
  onOpenCertificate,
  onOpenPublicVerify,
  notifications,
  onMarkAllAsRead,
  onSimulateSSE,
  onSelectNotification,
  onOpenAuthModal,
  children
}) => {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <Header
        currentPortal={currentPortal}
        onSelectPortal={onSelectPortal}
        onOpenLearningRoom={onOpenLearningRoom}
        onOpenCertificate={onOpenCertificate}
        onOpenPublicVerify={onOpenPublicVerify}
        notifications={notifications}
        onMarkAllAsRead={onMarkAllAsRead}
        onSimulateSSE={onSimulateSSE}
        onSelectNotification={onSelectNotification}
        onOpenAuthModal={onOpenAuthModal}
      />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
