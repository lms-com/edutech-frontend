import React from 'react';
import { Header } from '../components/common/Header';
import type { PortalType, NotificationItem } from '../types';

interface MainLayoutProps {
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

export const MainLayout: React.FC<MainLayoutProps> = ({
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
      {/* 1. Header chuẩn hệ thống */}
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

      {/* 2. Nội dung chính */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 pt-6">
        {children}
      </main>

      {/* 3. Footer chuẩn học viên */}
      <footer className="bg-[#2c3e50] text-slate-300 py-12 border-t border-slate-700/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#e74c3c] flex items-center justify-center font-bold text-white shadow-md">
                E
              </div>
              <span className="text-xl font-bold text-white tracking-tight">EduTech LMS</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nền tảng học trực tuyến chất lượng cao với video bài giảng bảo mật HLS/AES-128, chứng chỉ số xác thực QR và thanh toán tức thời qua VNPay.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Danh mục phổ biến</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="hover:text-white cursor-pointer transition-colors">Lập trình Web Fullstack</li>
              <li className="hover:text-white cursor-pointer transition-colors">Trí tuệ nhân tạo (AI & ML)</li>
              <li className="hover:text-white cursor-pointer transition-colors">Thiết kế UI/UX & Đồ họa</li>
              <li className="hover:text-white cursor-pointer transition-colors">Khoa học dữ liệu & Big Data</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Hỗ trợ học viên</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="hover:text-white cursor-pointer transition-colors">Tra cứu & Xác thực chứng chỉ số</li>
              <li className="hover:text-white cursor-pointer transition-colors">Chính sách bảo mật & Thiết bị</li>
              <li className="hover:text-white cursor-pointer transition-colors">Hướng dẫn thanh toán VNPay</li>
              <li className="hover:text-white cursor-pointer transition-colors">Điều khoản dịch vụ</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Khu vực Giảng viên</h4>
            <p className="text-xs text-slate-400 mb-3">
              Trở thành Giảng viên trên EduTech để chia sẻ tri thức và nhận phân bổ doanh thu minh bạch.
            </p>
            <button
              onClick={() => onSelectPortal('instructor')}
              className="px-4 py-2 rounded-lg bg-[#e74c3c] hover:bg-[#c0392b] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              Mở Instructor Studio
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-slate-700/60 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} EduTech Platform. All rights reserved. Hệ thống Microservices chuẩn hóa cao cấp.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
