import { useState, useEffect } from 'react';
import type { PortalType, Course, NotificationItem } from './types';
import { MOCK_COURSES, MOCK_CERTIFICATE, MOCK_NOTIFICATIONS } from './data/mockData';
import { MainLayout } from './layouts/MainLayout';
import { LearningLayout } from './layouts/LearningLayout';
import { InstructorLayout } from './layouts/InstructorLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { CourseCatalog } from './components/catalog/CourseCatalog';
import { CourseDetail } from './components/catalog/CourseDetail';
import { LearningRoom } from './components/learning/LearningRoom';
import { CertificateView } from './components/certificate/CertificateView';
import { PublicVerifyView } from './components/certificate/PublicVerifyView';
import { InstructorStudio } from './components/instructor/InstructorStudio';
import { AdminPortal } from './components/admin/AdminPortal';
import { AuthModal } from './components/auth/AuthModal';
import courseApi from './api/courseApi';
import notificationApi from './api/notificationApi';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentPortal, setCurrentPortal] = useState<PortalType>('learner');
  const [coursesList, setCoursesList] = useState<Course[]>(MOCK_COURSES);
  const [activeCourse, setActiveCourse] = useState<Course>(MOCK_COURSES[0]);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [isInLearningRoom, setIsInLearningRoom] = useState<boolean>(false);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [publicVerifyHash, setPublicVerifyHash] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  // 1. Tải danh sách khóa học từ backend với fallback thông minh
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseApi.getCourses();
        if (data && Array.isArray(data) && data.length > 0) {
          // Nếu backend trả về courses, cập nhật vào state
          setCoursesList(data);
          setActiveCourse(data[0]);
        }
      } catch {
        // Fallback: Sử dụng dữ liệu mock chuẩn đã chuẩn bị
      }
    };
    fetchCourses();
  }, []);

  // 2. Tải thông báo & thiết lập luồng SSE Real-time
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const notifs = await notificationApi.getNotifications();
        if (notifs && Array.isArray(notifs) && notifs.length > 0) {
          const mapped: NotificationItem[] = notifs.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.content,
            type: n.type === 'ORDER_COMPLETED' ? 'PAYMENT' : 'SYSTEM',
            timestamp: new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            isRead: n.isRead,
          }));
          setNotifications(mapped);
        }
      } catch {
        // Fallback: Dùng danh sách thông báo mẫu
      }
    };
    fetchNotifs();

    // Kết nối SSE nếu chạy môi trường có Gateway
    try {
      const sseUrl = notificationApi.getSseUrl();
      const eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const newNotif: NotificationItem = {
            id: `sse_${Date.now()}`,
            title: data.title || 'Thông báo mới',
            message: data.content || data.message || '',
            type: data.type || 'SYSTEM',
            timestamp: 'Vừa xong',
            isRead: false,
          };
          setNotifications(prev => [newNotif, ...prev]);
        } catch {
          // Ignore parse errors
        }
      };

      return () => {
        eventSource.close();
      };
    } catch {
      // Ignore SSE unsupported environments
    }
  }, []);

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
    try {
      notificationApi.markAllAsRead();
    } catch {
      // Local state updated
    }
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

  // Nếu đang ở trang xác thực chứng chỉ công khai (Không cần đăng nhập, toàn màn hình)
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

  // Nếu đang trong phòng học LMS (Cinema Mode Layout)
  if (isInLearningRoom) {
    return (
      <LearningLayout
        courseTitle={activeCourse.title}
        progressPercent={activeCourse.sections.length > 0 ? 33 : 0}
        onBack={() => setIsInLearningRoom(false)}
        onOpenCertificate={handleOpenCertificate}
      >
        <LearningRoom
          course={activeCourse}
          onBack={() => setIsInLearningRoom(false)}
          onOpenCertificate={handleOpenCertificate}
        />

        {showCertificateModal && (
          <CertificateView
            certificate={MOCK_CERTIFICATE}
            onClose={() => setShowCertificateModal(false)}
            onOpenPublicVerify={handleOpenPublicVerify}
          />
        )}
      </LearningLayout>
    );
  }

  // Shared handlers for Header across layouts
  const sharedHeaderProps = {
    currentPortal,
    onSelectPortal: (portal: PortalType) => {
      setCurrentPortal(portal);
      setDetailCourse(null);
    },
    onOpenLearningRoom: () => setIsInLearningRoom(true),
    onOpenCertificate: handleOpenCertificate,
    onOpenPublicVerify: () => handleOpenPublicVerify(),
    notifications,
    onMarkAllAsRead: handleMarkAllAsRead,
    onSimulateSSE: handleSimulateSSE,
    onSelectNotification: (item: NotificationItem) => {
      if (item.type === 'CERTIFICATE') {
        handleOpenCertificate();
      }
    },
    onOpenAuthModal: () => setIsAuthModalOpen(true),
  };

  return (
    <>
      {/* 1. Phân hệ Giảng viên (Instructor Studio) */}
      {currentPortal === 'instructor' && (
        <InstructorLayout {...sharedHeaderProps}>
          <InstructorStudio
            course={activeCourse}
            onEnterLearningRoom={(course) => {
              setActiveCourse(course);
              setIsInLearningRoom(true);
            }}
            onBackToLearner={() => setCurrentPortal('learner')}
          />
        </InstructorLayout>
      )}

      {/* 2. Phân hệ Quản trị viên (Admin Portal) */}
      {currentPortal === 'admin' && (
        <AdminLayout {...sharedHeaderProps}>
          <AdminPortal
            onPreviewCourse={(course) => {
              setActiveCourse(course);
              setIsInLearningRoom(true);
            }}
            onBackToLearner={() => setCurrentPortal('learner')}
          />
        </AdminLayout>
      )}

      {/* 3. Phân hệ Học viên (Learner Portal - Default) */}
      {currentPortal === 'learner' && (
        <MainLayout {...sharedHeaderProps}>
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
              courses={coursesList}
              onSelectCourse={(course) => setDetailCourse(course)}
              onEnterLearningRoom={(course) => {
                setActiveCourse(course);
                setIsInLearningRoom(true);
              }}
            />
          )}
        </MainLayout>
      )}

      {/* Modal Chứng chỉ dùng chung */}
      {showCertificateModal && (
        <CertificateView
          certificate={MOCK_CERTIFICATE}
          onClose={() => setShowCertificateModal(false)}
          onOpenPublicVerify={handleOpenPublicVerify}
        />
      )}

      {/* IAM Modal Đăng nhập / Đăng ký */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(targetPortal) => {
          if (targetPortal) setCurrentPortal(targetPortal);
        }}
      />
    </>
  );
}
