import { useState, useEffect, useCallback } from 'react';
import type { PortalType, Course, NotificationItem } from './types';
import { MOCK_CERTIFICATE, MOCK_NOTIFICATIONS } from './data/mockData';
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
import { PaymentResultView } from './components/payment/PaymentResultView';
import { parseVNPayCallback, cleanUrlQueryParams } from './utils/vnpayHelper';
import { canAccessPortal } from './utils/roles';
import { getPendingPurchase, clearPendingPurchase } from './utils/pendingPurchase';
import { useAuthStore } from './stores/useAuthStore';
import type { VNPayPaymentResult } from './types';
import courseApi from './api/courseApi';
import notificationApi from './api/notificationApi';
import enrollmentApi, { type EnrollmentDto } from './api/enrollmentApi';
import { Loader2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentPortal, setCurrentPortal] = useState<PortalType>('learner');
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [courseCache, setCourseCache] = useState<Record<string, Course>>({});
  const [paymentCourse, setPaymentCourse] = useState<Course | null>(null);
  const [activeEnrollment, setActiveEnrollment] = useState<EnrollmentDto | null>(null);
  const [paymentResult, setPaymentResult] = useState<VNPayPaymentResult | null>(null);
  const [isInLearningRoom, setIsInLearningRoom] = useState<boolean>(false);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [publicVerifyHash, setPublicVerifyHash] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  const fetchCurrentUser = useAuthStore(state => state.fetchCurrentUser);

  // Khôi phục phiên đăng nhập từ token đã lưu để F5 không mất đăng nhập
  useEffect(() => {
    void fetchCurrentUser();
  }, [fetchCurrentUser]);

  /**
   * Cổng duy nhất kiểm soát việc chuyển portal: vai trò không hợp lệ thì không vào được,
   * dù bấm từ header, footer hay sau khi đăng nhập.
   */
  const handleSelectPortal = (portal: PortalType) => {
    if (!canAccessPortal(useAuthStore.getState().user?.roles, portal)) {
      return;
    }
    setCurrentPortal(portal);
    setDetailCourse(null);
  };

  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      // Lấy một trang lớn vì backend chưa hỗ trợ lọc phía server (xem CourseCatalog).
      const page = await courseApi.getCatalogCourses({ size: 100 });
      setCoursesList(page.items);
    } catch (err: any) {
      setCoursesError(err?.message || 'Không tải được danh sách khóa học từ máy chủ.');
      setCoursesList([]);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  /**
   * Bảo đảm có bản chi tiết (kèm chương/bài) trước khi hiển thị. Bản đã tải được
   * giữ trong cache nên mở lại cùng khóa học không gọi API lần nữa.
   */
  const ensureCourseDetail = useCallback(async (course: Course): Promise<Course> => {
    if (course.sections.length > 0) return course;
    const cached = courseCache[course.id];
    if (cached) return cached;
    const detail = await courseApi.getCourseById(course.id);
    setCourseCache(prev => ({ ...prev, [detail.id]: detail }));
    return detail;
  }, [courseCache]);

  const openCourseDetail = async (course: Course) => {
    setDetailCourse(course);
    setDetailError(null);
    setDetailLoading(true);
    try {
      setDetailCourse(await ensureCourseDetail(course));
    } catch (err: any) {
      // API chi tiết khóa học yêu cầu đăng nhập, nên 401 là trường hợp hay gặp nhất
      setDetailError(err?.code === 401
        ? 'Bạn cần đăng nhập để xem chi tiết khóa học này.'
        : err?.message || 'Không tải được chi tiết khóa học.');
    } finally {
      setDetailLoading(false);
    }
  };

  const enterLearningRoom = async (course: Course) => {
    try {
      setActiveCourse(await ensureCourseDetail(course));

      // Lượt ghi danh thật quyết định việc ghi nhận tiến độ và mở chứng chỉ
      let enrollment: EnrollmentDto | null = null;
      try {
        enrollment = await enrollmentApi.findMyEnrollmentForCourse(course.id);
      } catch (err: any) {
        // 401 là chưa đăng nhập: coi như chưa ghi danh, phòng học sẽ thông báo
        if (err?.code !== 401) throw err;
      }
      setActiveEnrollment(enrollment);
      setIsInLearningRoom(true);
    } catch (err: any) {
      setCoursesError(err?.message || 'Không mở được phòng học.');
    }
  };

  /**
   * VNPay chuyển hướng về bằng một lần nạp trang mới nên state đã mất; khôi phục
   * khóa học đang mua từ sessionStorage để trang kết quả hiển thị đúng.
   */
  useEffect(() => {
    if (!paymentResult) return;
    const courseId = getPendingPurchase();
    if (!courseId) return;

    const fromList = coursesList.find(course => course.id === courseId);
    if (fromList) {
      setPaymentCourse(fromList);
      return;
    }
    // Danh sách chưa tải xong thì chờ, tránh gọi API trùng
    if (coursesLoading) return;

    let cancelled = false;
    void courseApi.getCourseById(courseId)
      .then(course => { if (!cancelled) setPaymentCourse(course); })
      .catch(err => console.warn('Không khôi phục được khóa học sau thanh toán:', err));
    return () => { cancelled = true; };
  }, [paymentResult, coursesList, coursesLoading]);

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

  // 3. Tự động phát hiện và xử lý kết quả thanh toán từ VNPay Callback URL
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const result = parseVNPayCallback(window.location.search);
      if (result) {
        setPaymentResult(result);
        cleanUrlQueryParams();

        // Tự động đẩy thông báo vào Notification Dropdown
        const newNotif: NotificationItem = {
          id: `pay_${Date.now()}`,
          title: result.isSuccess ? 'Thanh toán thành công' : 'Thanh toán không thành công',
          message: result.message,
          type: 'PAYMENT',
          timestamp: 'Vừa xong',
          isRead: false,
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }
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
  if (isInLearningRoom && activeCourse) {
    return (
      <LearningLayout
        courseTitle={activeCourse.title}
        progressPercent={activeEnrollment?.completedRate ?? 0}
        onBack={() => setIsInLearningRoom(false)}
        onOpenCertificate={handleOpenCertificate}
      >
        <LearningRoom
          course={activeCourse}
          enrollment={activeEnrollment}
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
    onSelectPortal: handleSelectPortal,
    onOpenLearningRoom: () => {
      if (activeCourse) setIsInLearningRoom(true);
    },
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

  /** Studio giảng viên hiện vẫn dùng dữ liệu mẫu và cần một khóa học để hiển thị. */
  const instructorCourse = activeCourse ?? coursesList[0] ?? null;

  return (
    <>
      {/* 1. Phân hệ Giảng viên (Instructor Studio) */}
      {currentPortal === 'instructor' && (
        <InstructorLayout {...sharedHeaderProps}>
          {instructorCourse ? (
            <InstructorStudio
              course={instructorCourse}
              onEnterLearningRoom={enterLearningRoom}
              onBackToLearner={() => handleSelectPortal('learner')}
            />
          ) : (
            <div className="p-10 text-center text-sm text-slate-500">
              Chưa có khóa học nào để hiển thị trong Studio.
            </div>
          )}
        </InstructorLayout>
      )}

      {/* 2. Phân hệ Quản trị viên (Admin Portal) */}
      {currentPortal === 'admin' && (
        <AdminLayout {...sharedHeaderProps}>
          <AdminPortal
            onPreviewCourse={enterLearningRoom}
            onBackToLearner={() => handleSelectPortal('learner')}
          />
        </AdminLayout>
      )}

      {/* 3. Phân hệ Học viên (Learner Portal - Default) */}
      {currentPortal === 'learner' && (
        <MainLayout {...sharedHeaderProps}>
          {paymentResult ? (
            <PaymentResultView
              result={paymentResult}
              courseTitle={paymentCourse?.title || 'Khóa học'}
              courseId={paymentCourse?.id || ''}
              onStartLearning={async () => {
                clearPendingPurchase();
                setPaymentResult(null);
                setDetailCourse(null);
                if (paymentCourse) {
                  await enterLearningRoom(paymentCourse);
                }
              }}
              onRetry={() => {
                setPaymentResult(null);
                clearPendingPurchase();
              }}
              onBackHome={() => {
                setPaymentResult(null);
                setPaymentCourse(null);
                setDetailCourse(null);
                clearPendingPurchase();
              }}
            />
          ) : detailCourse ? (
            detailLoading ? (
              <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tải chi tiết khóa học...
              </div>
            ) : detailError ? (
              <div className="max-w-xl mx-auto my-16 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-700 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{detailError}</span>
                </div>
                <button
                  onClick={() => setDetailCourse(null)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer"
                >
                  Quay lại danh mục
                </button>
              </div>
            ) : (
              <CourseDetail
                course={detailCourse}
                onBack={() => setDetailCourse(null)}
                onStartLearning={enterLearningRoom}
              />
            )
          ) : (
            <CourseCatalog
              courses={coursesList}
              loading={coursesLoading}
              error={coursesError}
              onRetry={loadCourses}
              onSelectCourse={openCourseDetail}
              onEnterLearningRoom={enterLearningRoom}
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
          if (targetPortal) handleSelectPortal(targetPortal);
        }}
      />
    </>
  );
}
