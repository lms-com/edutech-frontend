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
import { Award, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentPortal, setCurrentPortal] = useState<PortalType>('learner');
  const [activeCourse, setActiveCourse] = useState<Course>(MOCK_COURSES[0]);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [isInLearningRoom, setIsInLearningRoom] = useState<boolean>(true); // Focus on learning room & certificate workflow
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [publicVerifyHash, setPublicVerifyHash] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  
  // Real-time notifications state (SSE simulation)
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [liveToast, setLiveToast] = useState<{ title: string; message: string; type: string } | null>(null);

  // Trigger Toast Notification
  const showToast = (title: string, message: string, type: string) => {
    setLiveToast({ title, message, type });
    setTimeout(() => {
      setLiveToast(null);
    }, 4500);
  };

  // Simulate incoming SSE event from backend Notification-Service
  const handleSimulateSSE = () => {
    const sseEvents = [
      {
        title: 'SSE: Cấp phát Chứng chỉ Tốt nghiệp!',
        message: 'Notification-service vừa hoàn tất ký số SHA-256 cho chứng chỉ khóa học Microservices của bạn.',
        type: 'CERTIFICATE' as const
      },
      {
        title: 'SSE: Media-service mã hóa hoàn tất',
        message: 'FFmpeg worker đã tạo xong danh sách playlist m3u8 và khóa bảo mật AES-128 cho bài học mới.',
        type: 'VIDEO_PROCESSED' as const
      },
      {
        title: 'SSE: Xác nhận đơn hàng PayOS',
        message: 'Hệ thống đã nhận được webhook giao dịch từ cổng thanh toán qua API Gateway:8080.',
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
    showToast(randomEvent.title, randomEvent.message, randomEvent.type);
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

        {/* Live SSE Toast Popup */}
        {liveToast && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#2c3e50] text-white p-4 rounded-2xl shadow-2xl border border-[#e74c3c]/50 flex items-start gap-3 max-w-sm animate-in slide-in-from-bottom-5">
            <div className="w-8 h-8 rounded-full bg-[#e74c3c] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Award className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <div className="font-bold flex items-center justify-between">
                <span>{liveToast.title}</span>
                <span className="text-[10px] text-emerald-400 font-mono">SSE LIVE</span>
              </div>
              <p className="text-slate-300 mt-1">{liveToast.message}</p>
            </div>
            <button onClick={() => setLiveToast(null)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Standard Portal Layout
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#2c3e50] flex flex-col font-sans">
      {/* Universal Header with Microservices Banner, RBAC, and Auth */}
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

      {/* Main Body */}
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
          />
        )}

        {/* PORTAL 3: ADMIN PORTAL */}
        {currentPortal === 'admin' && (
          <AdminPortal
            onPreviewCourse={(course) => {
              setActiveCourse(course);
              setIsInLearningRoom(true);
            }}
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

      {/* Live SSE Toast Popup */}
      {liveToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2c3e50] text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-start gap-3 max-w-sm animate-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <div className="font-bold flex items-center justify-between">
              <span>{liveToast.title}</span>
              <span className="text-[10px] text-emerald-400 font-mono">SSE EVENT</span>
            </div>
            <p className="text-slate-300 mt-1">{liveToast.message}</p>
          </div>
          <button onClick={() => setLiveToast(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#2c3e50]">EduTech Microservices LMS</span>
            <span>•</span>
            <span className="font-mono text-slate-400">Spring Cloud Gateway (:8080)</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <button onClick={() => handleOpenCertificate()} className="hover:text-[#e74c3c] transition-colors cursor-pointer">
              Chứng chỉ mẫu A4
            </button>
            <button onClick={() => handleOpenPublicVerify()} className="hover:text-emerald-600 transition-colors cursor-pointer">
              Xác thực QR Công khai
            </button>
            <button onClick={() => setIsInLearningRoom(true)} className="hover:text-[#2c3e50] transition-colors cursor-pointer">
              Phòng học Cinema Mode
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
