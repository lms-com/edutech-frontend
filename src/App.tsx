import { useState } from 'react';
import type { PortalType, Course, NotificationItem } from './types';
import { MOCK_COURSES, MOCK_CERTIFICATE, MOCK_NOTIFICATIONS } from './data/mockData';
import { Header } from './components/common/Header';
import { CourseCatalog } from './components/catalog/CourseCatalog';
import { CourseDetail } from './components/catalog/CourseDetail';
import { LearningRoom } from './components/learning/LearningRoom';
import { CertificateView } from './components/certificate/CertificateView';
import { PublicVerifyView } from './components/certificate/PublicVerifyView';
import { InstructorStudio } from './components/instructor/InstructorStudio';
import { AdminPortal } from './components/admin/AdminPortal';
import { AuthModal } from './components/auth/AuthModal';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentPortal, setCurrentPortal] = useState<PortalType>('learner');
  const [activeCourse, setActiveCourse] = useState<Course>(MOCK_COURSES[0]);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [isInLearningRoom, setIsInLearningRoom] = useState<boolean>(false);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [publicVerifyHash, setPublicVerifyHash] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  const handleSimulateSSE = () => {
    const sseEvents = [
      {
        title: 'Cấp chứng chỉ tốt nghiệp!',
        message: 'Chứng chỉ khóa học của bạn đã sẵn sàng và được ký số SHA-256.',
        type: 'CERTIFICATE' as const
      },
      {
        title: 'Bài giảng mới đã sẵn sàng',
        message: 'Hệ thống đã tối ưu hóa và xuất bản bài giảng mới cho khóa học của bạn.',
        type: 'VIDEO_PROCESSED' as const
      },
      {
        title: 'Xác nhận thanh toán thành công',
        message: 'Giao dịch đăng ký khóa học đã được hệ thống ghi nhận thành công.',
        type: 'PAYMENT' as const
      }
    ];

    const randomEvent = sseEvents[Math.floor(Math.random() * sseEvents.length)];
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: randomEvent.title,
      message: randomEvent.message,
      type: randomEvent.type,
      timestamp: 'Vừa xong',
      isRead: false
    };

    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleOpenCertificate = () => {
    setShowCertificateModal(true);
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.4 }
      });
    } catch {
      // Ignore
    }
  };

  const handleOpenPublicVerify = (hash?: string) => {
    setPublicVerifyHash(hash || MOCK_CERTIFICATE.qrCodeHash);
    setCurrentPortal('public_verify');
    setShowCertificateModal(false);
  };

  // If currently in Public Verification Page (No login required, full-screen)
  if (currentPortal === 'public_verify') {
    return (
      <PublicVerifyView
        hash={publicVerifyHash || MOCK_CERTIFICATE.qrCodeHash}
        certificate={MOCK_CERTIFICATE}
        onBackToApp={() => setCurrentPortal('learner')}
        onOpenCertificatePreview={() => setShowCertificateModal(true)}
      />
    );
  }

  // If inside LMS Learning Room (Cinema Mode)
  if (isInLearningRoom) {
    return (
      <div className="relative">
        <LearningRoom
          course={activeCourse}
          onBack={() => setIsInLearningRoom(false)}
          onOpenCertificate={handleOpenCertificate}
        />

        {/* Certificate Modal inside Learning Room */}
        {showCertificateModal && (
          <CertificateView
            certificate={MOCK_CERTIFICATE}
            onClose={() => setShowCertificateModal(false)}
            onOpenPublicVerify={handleOpenPublicVerify}
          />
        )}
      </div>
    );
  }

  // Standard Unified LMS Layout
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#2c3e50] flex flex-col font-sans">
      {/* Sleek Universal Header */}
      <Header
        currentPortal={currentPortal}
        onSelectPortal={portal => {
          setCurrentPortal(portal);
          setDetailCourse(null);
        }}
        onOpenLearningRoom={() => {
          setIsInLearningRoom(true);
        }}
        onOpenCertificate={handleOpenCertificate}
        onOpenPublicVerify={() => handleOpenPublicVerify()}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllAsRead}
        onSimulateSSE={handleSimulateSSE}
        onSelectNotification={(item) => {
          if (item.type === 'CERTIFICATE') {
            handleOpenCertificate();
          }
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 pt-6">
        {/* PORTAL 1: LEARNER PORTAL */}
        {currentPortal === 'learner' && (
          <>
            {detailCourse ? (
              <CourseDetail
                course={detailCourse}
                onBack={() => setDetailCourse(null)}
                onStartLearning={(course) => {
                  setActiveCourse(course);
                  setIsInLearningRoom(true);
                }}
              />
            ) : (
              <CourseCatalog
                courses={MOCK_COURSES}
                onSelectCourse={(course) => setDetailCourse(course)}
                onEnterLearningRoom={(course) => {
                  setActiveCourse(course);
                  setIsInLearningRoom(true);
                }}
              />
            )}
          </>
        )}

        {/* PORTAL 2: INSTRUCTOR STUDIO */}
        {currentPortal === 'instructor' && (
          <InstructorStudio
            course={activeCourse}
            onEnterLearningRoom={(course) => {
              setActiveCourse(course);
              setIsInLearningRoom(true);
            }}
            onBackToLearner={() => setCurrentPortal('learner')}
          />
        )}

        {/* PORTAL 3: ADMIN PORTAL */}
        {currentPortal === 'admin' && (
          <AdminPortal
            onPreviewCourse={(course) => {
              setActiveCourse(course);
              setIsInLearningRoom(true);
            }}
            onBackToLearner={() => setCurrentPortal('learner')}
          />
        )}
      </main>

      {/* Certificate Modal */}
      {showCertificateModal && (
        <CertificateView
          certificate={MOCK_CERTIFICATE}
          onClose={() => setShowCertificateModal(false)}
          onOpenPublicVerify={handleOpenPublicVerify}
        />
      )}

      {/* IAM Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(targetPortal) => {
          if (targetPortal) setCurrentPortal(targetPortal);
        }}
      />

      {/* Modern, Clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-6 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm text-[#2c3e50]">Edu<span className="text-[#e74c3c]">Tech</span> LMS</span>
            <span className="text-slate-300">•</span>
            <span>Nền tảng đào tạo kỹ sư công nghệ chất lượng cao</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-medium">
            <button 
              onClick={() => { setCurrentPortal('learner'); setDetailCourse(null); }} 
              className="hover:text-[#2c3e50] transition-colors cursor-pointer"
            >
              Khám phá khóa học
            </button>
            <button 
              onClick={() => handleOpenPublicVerify()} 
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Tra cứu chứng chỉ QR
            </button>
            <button 
              onClick={() => handleOpenCertificate()} 
              className="hover:text-[#e74c3c] transition-colors cursor-pointer"
            >
              Chứng chỉ mẫu
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-4 mt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <p>© 2026 EduTech LMS. Bảo lưu mọi quyền.</p>
          <p>Hệ thống hỗ trợ kiểm soát thiết bị & mã hóa bản quyền bài giảng</p>
        </div>
      </footer>
    </div>
  );
}
