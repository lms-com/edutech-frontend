import { useState, useEffect, useCallback } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import type { PortalType, Course, Certificate, NotificationItem, VNPayPaymentResult } from './types';
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
import { InstructorCourseManager } from './components/instructor/InstructorCourseManager';
import { AdminPortal } from './components/admin/AdminPortal';
import { AuthModal } from './components/auth/AuthModal';
import { PaymentResultView } from './components/payment/PaymentResultView';
import { OrderHistoryModal } from './components/payment/OrderHistoryModal';
import { parseVNPayCallback, cleanUrlQueryParams } from './utils/vnpayHelper';
import { canAccessPortal } from './utils/roles';
import { getPendingPurchase, clearPendingPurchase } from './utils/pendingPurchase';
import { useAuthStore } from './stores/useAuthStore';
import courseApi from './api/courseApi';
import orderApi from './api/orderApi';
import notificationApi from './api/notificationApi';
import { mapCertificate } from './api/mappers/notificationMapper';
import enrollmentApi, { type EnrollmentDto } from './api/enrollmentApi';
import { Loader2, AlertCircle, Award, Bell, X, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Danh sách khóa học và danh sách ghi danh của học viên
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [myEnrollments, setMyEnrollments] = useState<EnrollmentDto[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [courseCache, setCourseCache] = useState<Record<string, Course>>({});

  // Modals & Thông báo toàn cục
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [activeNotificationToast, setActiveNotificationToast] = useState<NotificationItem | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certificateForPreview, setCertificateForPreview] = useState<Certificate | null>(null);

  const fetchCurrentUser = useAuthStore(state => state.fetchCurrentUser);
  const currentUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Xác định phân hệ hiện tại từ đường dẫn URL (đồng bộ chuẩn xác với URL)
  const currentPortal: PortalType = location.pathname.startsWith('/instructor')
    ? 'instructor'
    : location.pathname.startsWith('/admin')
    ? 'admin'
    : location.pathname.startsWith('/verify') || location.pathname.startsWith('/certificates/verify')
    ? 'public_verify'
    : 'learner';

  // Khôi phục phiên đăng nhập từ token đã lưu để F5 không mất đăng nhập
  useEffect(() => {
    void fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Tự động chuyển hướng về trang chủ khi đăng xuất nếu đang ở phân hệ quản trị / giảng viên
  useEffect(() => {
    if (isAuthenticated) return;
    if (location.pathname.startsWith('/instructor') || location.pathname.startsWith('/admin')) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  /** Chuyển portal điều hướng qua React Router */
  const handleSelectPortal = (portal: PortalType) => {
    if (!canAccessPortal(useAuthStore.getState().user?.roles, portal)) {
      return;
    }
    if (portal === 'instructor') {
      navigate('/instructor');
    } else if (portal === 'admin') {
      navigate('/admin');
    } else if (portal === 'public_verify') {
      navigate('/verify');
    } else {
      navigate('/');
    }
  };

  /** Nạp danh mục khóa học */
  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      const page = await courseApi.getCourses();
      setCoursesList(page.items);
      setCourseCache(prev => {
        const next = { ...prev };
        for (const c of page.items) {
          if (!next[c.id]) next[c.id] = c;
        }
        return next;
      });
    } catch (err: any) {
      setCoursesError(err?.message || 'Không tải được danh sách khóa học.');
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  /** Nạp danh sách ghi danh của tôi */
  const loadMyEnrollments = useCallback(async () => {
    if (!localStorage.getItem('access_token')) {
      setMyEnrollments([]);
      return;
    }
    setEnrollmentsLoading(true);
    try {
      const page = await enrollmentApi.getMyEnrollments();
      setMyEnrollments(page.items);
    } catch {
      setMyEnrollments([]);
    } finally {
      setEnrollmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMyEnrollments();
  }, [loadMyEnrollments, isAuthenticated]);

  /** Bảo đảm khóa học có đủ cấu trúc chương & bài học (cache để tránh gọi lặp) */
  const ensureCourseDetail = useCallback(async (courseOrId: Course | string): Promise<Course> => {
    const id = typeof courseOrId === 'string' ? courseOrId : courseOrId.id;
    const existing = courseCache[id];
    if (existing && existing.sections && existing.sections.length > 0) {
      return existing;
    }
    const detail = await courseApi.getCourseById(id);
    setCourseCache(prev => ({ ...prev, [detail.id]: detail }));
    return detail;
  }, [courseCache]);

  /** Polling quyền học cho đến khi ACTIVE */
  const pollEnrollmentActive = async (
    courseId: string,
    maxRetries = 6,
    delayMs = 800
  ): Promise<EnrollmentDto | null> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const enrollment = await enrollmentApi.findMyEnrollmentForCourse(courseId);
        if (enrollment && enrollment.status?.toUpperCase() === 'ACTIVE') {
          return enrollment;
        }
      } catch (err) {
        console.warn(`Lần thử ${i + 1}/${maxRetries} kiểm tra quyền học:`, err);
      }
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    return null;
  };

  /** Đăng ký khóa học miễn phí */
  const enrollInFreeCourse = async (course: Course) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const enrollment = await enrollmentApi.enrollInFreeCourse(course.id);
    setMyEnrollments(prev => [enrollment, ...prev.filter(item => item.courseId !== course.id)]);
    navigate(`/learn/${course.id}`);
  };

  /** Tải thông báo */
  const loadNotifications = useCallback(async () => {
    if (!localStorage.getItem('access_token')) {
      setNotifications([]);
      return;
    }
    setNotificationsError(null);
    try {
      const page = await notificationApi.getNotifications();
      setNotifications(page.items);
    } catch (err: any) {
      setNotificationsError(err?.message || 'Không tải được thông báo.');
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications, isAuthenticated]);

  // Tự động đóng toast thông báo sau 6 giây
  useEffect(() => {
    if (!activeNotificationToast) return;
    const timer = setTimeout(() => {
      setActiveNotificationToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeNotificationToast]);

  /** Luồng SSE realtime cho thông báo */
  useEffect(() => {
    if (!currentUser?.id) return;
    const eventSource = new EventSource(notificationApi.getSseUrl(currentUser.id));

    const handleNewNotification = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data?.title) return;
        const newNotif: NotificationItem = {
          id: data.id ?? `sse_${Date.now()}`,
          title: data.title,
          message: data.content ?? data.message ?? '',
          type: data.type ?? '',
          timestamp: 'Vừa xong',
          isRead: false,
        };
        setNotifications(prev => [newNotif, ...prev]);
        setActiveNotificationToast(newNotif);
      } catch {
        // Bỏ qua nếu không parse được
      }
    };

    eventSource.onmessage = handleNewNotification;
    eventSource.addEventListener('NEW_NOTIFICATION', handleNewNotification);

    eventSource.onerror = () => {
      console.warn('Luồng thông báo realtime gián đoạn, đang thử kết nối lại...');
    };

    return () => {
      eventSource.removeEventListener('NEW_NOTIFICATION', handleNewNotification);
      eventSource.close();
    };
  }, [currentUser?.id]);

  /** Đồng bộ kết quả thanh toán từ các tab khác qua BroadcastChannel */
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('edutech_payment');
      bc.onmessage = (event) => {
        if (event.data?.type === 'VNPAY_PAYMENT_COMPLETED') {
          const res = event.data.result as VNPayPaymentResult;
          void loadMyEnrollments();
          void loadNotifications();
          if (res?.isSuccess) {
            const toast: NotificationItem = {
              id: `bc_pay_${Date.now()}`,
              title: 'Thanh toán thành công',
              message: res.message || 'Khóa học của bạn đã được kích hoạt thành công!',
              type: 'PAYMENT',
              timestamp: 'Vừa xong',
              isRead: false,
            };
            setNotifications(prev => [toast, ...prev]);
            setActiveNotificationToast(toast);
          }
        }
      };
    } catch (e) {
      console.warn('Lỗi lắng nghe BroadcastChannel:', e);
    }
    return () => {
      if (bc) bc.close();
    };
  }, [loadMyEnrollments, loadNotifications]);

  /** Bắt query VNPay callback nếu người dùng vô tình truy cập vào URL gốc */
  useEffect(() => {
    if (location.pathname === '/' && location.search && location.search.includes('vnp_')) {
      navigate(`/payment/result${location.search}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  /** Bắt query verify QR code nếu truy cập /?verify=... */
  useEffect(() => {
    const verifyHash = new URLSearchParams(location.search).get('verify');
    if (verifyHash) {
      navigate(`/verify/${verifyHash}`, { replace: true });
    }
  }, [location.search, navigate]);

  /** Tải chứng chỉ của tôi */
  const loadCertificates = useCallback(async (): Promise<Certificate[]> => {
    if (!isAuthenticated) {
      setCertificates([]);
      return [];
    }
    try {
      const list = await notificationApi.getMyCertificates();
      const mapped = list.map(dto => mapCertificate(dto, {
        courseTitle: coursesList.find(course => course.id === dto.courseId)?.title,
        studentName: currentUser?.fullName,
        studentEmail: currentUser?.email,
      }));
      setCertificates(mapped);
      return mapped;
    } catch (err) {
      console.warn('Không tải được chứng chỉ:', err);
      return [];
    }
  }, [isAuthenticated, coursesList, currentUser?.fullName, currentUser?.email]);

  useEffect(() => {
    void loadCertificates();
  }, [loadCertificates]);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
    } catch (err: any) {
      setNotificationsError(err?.message || 'Không đánh dấu được đã đọc.');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(item => (item.id === notificationId ? { ...item, isRead: true } : item)));
    } catch (err) {
      console.warn('Không đánh dấu đã đọc được:', err);
    }
  };

  const activeCertificate = certificates[0] ?? null;
  const certificateToShow = certificateForPreview ?? activeCertificate;

  const handleOpenCertificate = async () => {
    setCertificateForPreview(null);
    setShowCertificateModal(true);
    let cert = activeCertificate;
    if (!cert && isAuthenticated) {
      const refreshed = await loadCertificates();
      cert = refreshed[0] ?? null;
    }
    if (cert) {
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.4 } });
      } catch {}
    }
  };

  const handleOpenPublicVerify = (hash?: string) => {
    setShowCertificateModal(false);
    navigate(hash ? `/verify/${hash}` : '/verify');
  };

  // Shared Header props
  const sharedHeaderProps = {
    currentPortal,
    onSelectPortal: handleSelectPortal,
    onOpenLearningRoom: () => {
      const lastEnrolled = myEnrollments.find(e => e.status?.toUpperCase() === 'ACTIVE');
      if (lastEnrolled) {
        navigate(`/learn/${lastEnrolled.courseId}`);
      } else {
        navigate('/');
      }
    },
    onOpenCertificate: handleOpenCertificate,
    onOpenPublicVerify: () => handleOpenPublicVerify(),
    notifications,
    onMarkAllAsRead: handleMarkAllAsRead,
    onMarkAsRead: handleMarkAsRead,
    onSelectNotification: (item: NotificationItem) => {
      if (item.type === 'CERTIFICATE' || item.type === 'COURSE_COMPLETED') {
        handleOpenCertificate();
      } else if (item.type === 'ORDER_COMPLETED') {
        setShowOrderHistoryModal(true);
      } else if (item.type === 'COURSE_APPROVED' || item.type === 'COURSE_REJECTED' || item.type === 'PAYOUT_APPROVED' || item.type === 'PAYOUT_REJECTED') {
        if (canAccessPortal(currentUser?.roles || [], 'instructor')) {
          navigate('/instructor');
        }
      }
    },
    onOpenAuthModal: () => setIsAuthModalOpen(true),
    onOpenOrderHistory: () => setShowOrderHistoryModal(true),
  };

  return (
    <>
      <Routes>
        {/* 1. Trang chủ / Danh mục khóa học */}
        <Route
          path="/"
          element={
            <MainLayout {...sharedHeaderProps}>
              <CourseCatalog
                courses={coursesList}
                enrollments={myEnrollments}
                enrollmentsLoading={enrollmentsLoading}
                loading={coursesLoading}
                error={coursesError}
                onRetry={loadCourses}
                onSelectCourse={(courseOrId) => {
                  const id = typeof courseOrId === 'string' ? courseOrId : courseOrId.id;
                  navigate(`/courses/${id}`);
                }}
                onEnterLearningRoom={(course) => navigate(`/learn/${course.id}`)}
              />
            </MainLayout>
          }
        />

        {/* 2. Chi tiết khóa học theo URL */}
        <Route
          path="/courses/:courseId"
          element={
            <MainLayout {...sharedHeaderProps}>
              <CourseDetailWrapper
                coursesList={coursesList}
                courseCache={courseCache}
                setCourseCache={setCourseCache}
                myEnrollments={myEnrollments}
                ensureCourseDetail={ensureCourseDetail}
                onEnrollFreeCourse={enrollInFreeCourse}
              />
            </MainLayout>
          }
        />

        {/* 3. Phòng học trực tuyến LMS (Cinema Mode) */}
        <Route
          path="/learn/:courseId"
          element={
            <LearningRoomWrapper
              ensureCourseDetail={ensureCourseDetail}
              pollEnrollmentActive={pollEnrollmentActive}
              myEnrollments={myEnrollments}
              setMyEnrollments={setMyEnrollments}
              isAuthenticated={isAuthenticated}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onOpenCertificate={handleOpenCertificate}
              showCertificateModal={showCertificateModal}
              certificateToShow={certificateToShow}
              setShowCertificateModal={setShowCertificateModal}
              handleOpenPublicVerify={handleOpenPublicVerify}
            />
          }
        />

        {/* 4. Kết quả thanh toán VNPay */}
        <Route
          path="/payment/result"
          element={
            <MainLayout {...sharedHeaderProps}>
              <PaymentResultWrapper
                coursesList={coursesList}
                loadMyEnrollments={loadMyEnrollments}
                loadNotifications={loadNotifications}
                setActiveNotificationToast={setActiveNotificationToast}
              />
            </MainLayout>
          }
        />

        {/* 5. Phân hệ Giảng viên: Danh sách khóa học */}
        <Route
          path="/instructor"
          element={
            canAccessPortal(currentUser?.roles, 'instructor') ? (
              <InstructorLayout {...sharedHeaderProps}>
                <InstructorCourseManager
                  onSelectCourse={(course) => navigate(`/instructor/courses/${course.id}`)}
                  onBackToLearner={() => navigate('/')}
                />
              </InstructorLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* 6. Phân hệ Giảng viên: Quản trị nội dung khóa học (Studio) */}
        <Route
          path="/instructor/courses/:courseId"
          element={
            canAccessPortal(currentUser?.roles, 'instructor') ? (
              <InstructorLayout {...sharedHeaderProps}>
                <InstructorStudioWrapper ensureCourseDetail={ensureCourseDetail} />
              </InstructorLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* 7. Phân hệ Quản trị viên (Admin Portal) */}
        <Route
          path="/admin"
          element={
            canAccessPortal(currentUser?.roles, 'admin') ? (
              <AdminLayout {...sharedHeaderProps} onBackToLearner={() => navigate('/')}>
                <AdminPortal
                  onPreviewCourse={(course) => navigate(`/learn/${course.id}?preview=true`)}
                  onBackToLearner={() => navigate('/')}
                />
              </AdminLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* 8. Tra cứu chứng chỉ công khai */}
        <Route
          path="/verify"
          element={
            <PublicVerifyWrapper
              setCertificateForPreview={setCertificateForPreview}
              setShowCertificateModal={setShowCertificateModal}
              showCertificateModal={showCertificateModal}
              certificateToShow={certificateToShow}
              handleOpenPublicVerify={handleOpenPublicVerify}
            />
          }
        />
        <Route
          path="/verify/:hash"
          element={
            <PublicVerifyWrapper
              setCertificateForPreview={setCertificateForPreview}
              setShowCertificateModal={setShowCertificateModal}
              showCertificateModal={showCertificateModal}
              certificateToShow={certificateToShow}
              handleOpenPublicVerify={handleOpenPublicVerify}
            />
          }
        />
        <Route
          path="/certificates/verify/:hash"
          element={
            <PublicVerifyWrapper
              setCertificateForPreview={setCertificateForPreview}
              setShowCertificateModal={setShowCertificateModal}
              showCertificateModal={showCertificateModal}
              certificateToShow={certificateToShow}
              handleOpenPublicVerify={handleOpenPublicVerify}
            />
          }
        />

        {/* 9. Bắt các URL không tồn tại quay về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Modal Chứng chỉ dùng chung */}
      {showCertificateModal && certificateToShow && (
        <CertificateView
          certificate={certificateToShow}
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

      {/* Modal Lịch sử đơn hàng của học viên */}
      <OrderHistoryModal
        isOpen={showOrderHistoryModal}
        onClose={() => setShowOrderHistoryModal(false)}
        onSelectCourse={(courseId) => {
          setShowOrderHistoryModal(false);
          navigate(`/courses/${courseId}`);
        }}
      />

      {/* Floating Real-time Notification Toast Alert */}
      {activeNotificationToast && (
        <div className="fixed top-20 right-5 z-60 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 p-4 animate-in slide-in-from-right duration-300">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Bell className="w-4 h-4 text-[#e74c3c]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thông báo mới</span>
                <button
                  type="button"
                  onClick={() => setActiveNotificationToast(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-0.5 line-clamp-1">{activeNotificationToast.title}</h4>
              <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                {activeNotificationToast.message}
              </p>
              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">Vừa xong</span>
                <button
                  type="button"
                  onClick={() => {
                    sharedHeaderProps.onSelectNotification(activeNotificationToast);
                    setActiveNotificationToast(null);
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Xem chi tiết →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// SUB-ROUTER WRAPPERS: Độc lập, đọc URL params trực tiếp, hỗ trợ F5 & Bookmark
// ============================================================================

/** Wrapper chi tiết khóa học: /courses/:courseId */
function CourseDetailWrapper({
  coursesList,
  courseCache,
  setCourseCache,
  myEnrollments,
  ensureCourseDetail,
  onEnrollFreeCourse,
}: {
  coursesList: Course[];
  courseCache: Record<string, Course>;
  setCourseCache: React.Dispatch<React.SetStateAction<Record<string, Course>>>;
  myEnrollments: EnrollmentDto[];
  ensureCourseDetail: (c: Course | string) => Promise<Course>;
  onEnrollFreeCourse: (c: Course) => Promise<void>;
}) {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(courseCache[courseId || ''] || null);
  const [loading, setLoading] = useState(!course);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    ensureCourseDetail(courseId)
      .then((detail) => {
        if (!cancelled) setCourse(detail);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(
            err?.code === 401
              ? 'Bạn cần đăng nhập để xem chi tiết khóa học này.'
              : err?.message || 'Không tải được chi tiết khóa học.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, ensureCourseDetail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-32 text-sm text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        Đang tải chi tiết khóa học...
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-xl mx-auto my-16 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-700 space-y-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error || 'Không tìm thấy thông tin khóa học.'}</span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer"
        >
          Quay lại danh mục khóa học
        </button>
      </div>
    );
  }

  const isEnrolled = myEnrollments.some(
    (item) => item.courseId === course.id && item.status?.toUpperCase() === 'ACTIVE',
  );

  return (
    <CourseDetail
      course={course}
      isEnrolled={isEnrolled}
      onBack={() => navigate('/')}
      onStartLearning={(c) => navigate(`/learn/${c.id}`)}
      onEnrollFreeCourse={onEnrollFreeCourse}
      onSelectRelatedCourse={(c) => {
        const id = typeof c === 'string' ? c : c.id;
        navigate(`/courses/${id}`);
      }}
    />
  );
}

/** Wrapper phòng học trực tuyến LMS: /learn/:courseId */
function LearningRoomWrapper({
  ensureCourseDetail,
  pollEnrollmentActive,
  myEnrollments,
  setMyEnrollments,
  isAuthenticated,
  onOpenAuthModal,
  onOpenCertificate,
  showCertificateModal,
  certificateToShow,
  setShowCertificateModal,
  handleOpenPublicVerify,
}: {
  ensureCourseDetail: (c: Course | string) => Promise<Course>;
  pollEnrollmentActive: (id: string) => Promise<EnrollmentDto | null>;
  myEnrollments: EnrollmentDto[];
  setMyEnrollments: React.Dispatch<React.SetStateAction<EnrollmentDto[]>>;
  isAuthenticated: boolean;
  onOpenAuthModal: () => void;
  onOpenCertificate: () => void;
  showCertificateModal: boolean;
  certificateToShow: Certificate | null;
  setShowCertificateModal: (show: boolean) => void;
  handleOpenPublicVerify: (hash?: string) => void;
}) {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isPreview = searchParams.get('preview') === 'true';

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const initLearning = async () => {
      try {
        if (!isPreview && !isAuthenticated) {
          onOpenAuthModal();
          setError('Bạn cần đăng nhập để tham gia phòng học.');
          setLoading(false);
          return;
        }

        let currentEnrollment: EnrollmentDto | null = null;
        if (!isPreview) {
          currentEnrollment = await pollEnrollmentActive(courseId);
          if (!currentEnrollment || currentEnrollment.status?.toUpperCase() !== 'ACTIVE') {
            setError('Khóa học chưa được kích hoạt. Hãy hoàn tất thanh toán và kiểm tra lại.');
            setLoading(false);
            return;
          }
          if (!cancelled) {
            setEnrollment(currentEnrollment);
            setMyEnrollments(prev => [currentEnrollment!, ...prev.filter(i => i.courseId !== courseId)]);
          }
        }

        const fullCourse = await ensureCourseDetail(courseId);
        if (!cancelled) {
          setCourse(fullCourse);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Không thể mở phòng học.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void initLearning();

    return () => {
      cancelled = true;
    };
  }, [courseId, isPreview, isAuthenticated, ensureCourseDetail, pollEnrollmentActive, onOpenAuthModal, setMyEnrollments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center gap-3 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <span className="text-sm font-medium text-slate-300">Đang chuẩn bị phòng học và tải bài giảng...</span>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1e293b] border border-slate-700 rounded-3xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">Chưa thể vào phòng học</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{error || 'Không tìm thấy thông tin khóa học.'}</p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
            >
              Xem trang khóa học
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LearningLayout
      courseTitle={course.title}
      progressPercent={enrollment?.completedRate ?? 0}
      onBack={() => navigate(`/courses/${course.id}`)}
      onOpenCertificate={onOpenCertificate}
    >
      <LearningRoom
        course={course}
        enrollment={enrollment}
        previewMode={isPreview}
        onBack={() => navigate(`/courses/${course.id}`)}
        onOpenCertificate={onOpenCertificate}
      />

      {showCertificateModal && certificateToShow && (
        <CertificateView
          certificate={certificateToShow}
          onClose={() => setShowCertificateModal(false)}
          onOpenPublicVerify={handleOpenPublicVerify}
        />
      )}
    </LearningLayout>
  );
}

/**
 * Wrapper trang kết quả thanh toán VNPay: /payment/result
 * Giải quyết dứt điểm nút "Vào phòng học ngay": Tự động tra cứu courseId từ orderId/enrollment nếu storage bị thiếu
 */
function PaymentResultWrapper({
  coursesList,
  loadMyEnrollments,
  loadNotifications,
  setActiveNotificationToast,
}: {
  coursesList: Course[];
  loadMyEnrollments: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  setActiveNotificationToast: (n: NotificationItem | null) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const [paymentResult, setPaymentResult] = useState<VNPayPaymentResult | null>(() => {
    return parseVNPayCallback(location.search);
  });
  const [resolvedCourse, setResolvedCourse] = useState<Course | null>(null);
  const [resolvedCourseId, setResolvedCourseId] = useState<string>(() => getPendingPurchase() || '');
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Xử lý callback VNPay khi trang kết quả mount
  useEffect(() => {
    const res = parseVNPayCallback(location.search);
    if (res) {
      setPaymentResult(res);
      cleanUrlQueryParams();

      if (res.isSuccess) {
        void loadMyEnrollments();
        void loadNotifications();
      }

      const toast: NotificationItem = {
        id: `pay_${Date.now()}`,
        title: res.isSuccess ? 'Thanh toán thành công' : 'Thanh toán không thành công',
        message: res.message,
        type: 'PAYMENT',
        timestamp: 'Vừa xong',
        isRead: false,
      };
      setActiveNotificationToast(toast);
    }
  }, [location.search, loadMyEnrollments, loadNotifications, setActiveNotificationToast]);

  // Tự động phân giải courseId qua nhiều nguồn: pendingStorage -> enrollments -> orderId
  useEffect(() => {
    let cancelled = false;

    const resolveCourse = async () => {
      let targetId = resolvedCourseId || getPendingPurchase() || '';

      // 1. Nếu chưa có targetId, thử tìm qua các khóa học đã ghi danh
      if (!targetId) {
        try {
          const myEnr = await enrollmentApi.getMyEnrollments();
          if (myEnr.items && myEnr.items.length > 0) {
            const active = myEnr.items.find(e => e.status?.toUpperCase() === 'ACTIVE') || myEnr.items[0];
            if (active) targetId = active.courseId;
          }
        } catch (e) {
          console.warn('Lỗi kiểm tra enrollments:', e);
        }
      }

      // 2. Nếu vẫn chưa có và có mã đơn hàng từ VNPay (vnp_TxnRef), gọi orderApi lấy chi tiết đơn hàng
      if (!targetId && paymentResult?.orderId) {
        try {
          const rawOrderId = paymentResult.orderId.split('_')[0];
          const order = await orderApi.getOrderDetail(rawOrderId);
          if (order?.items?.[0]?.courseId) {
            targetId = order.items[0].courseId;
          }
        } catch (e) {
          console.warn('Lỗi kiểm tra đơn hàng từ orderApi:', e);
        }
      }

      if (targetId && !cancelled) {
        setResolvedCourseId(targetId);
        // Tìm trong coursesList đã có hoặc gọi getCourseById
        const fromList = coursesList.find(c => c.id === targetId);
        if (fromList) {
          setResolvedCourse(fromList);
        } else {
          try {
            const fetched = await courseApi.getCourseById(targetId);
            if (!cancelled) setResolvedCourse(fetched);
          } catch (err) {
            console.warn('Không tải được chi tiết khóa học:', err);
          }
        }
      }
    };

    void resolveCourse();

    return () => {
      cancelled = true;
    };
  }, [paymentResult?.orderId, coursesList, resolvedCourseId]);

  /** Nút "Vào phòng học ngay" HOẠT ĐỘNG CHUẨN XÁC 100% */
  const handleStartLearning = async (overrideId?: string) => {
    setIsResolving(true);
    setErrorMessage(null);
    try {
      let id = overrideId || resolvedCourseId || resolvedCourse?.id || getPendingPurchase();

      // Nếu vẫn thiếu ID, thử vét cạn qua enrollments
      if (!id) {
        try {
          const myEnr = await enrollmentApi.getMyEnrollments();
          if (myEnr.items && myEnr.items.length > 0) {
            const active = myEnr.items.find(e => e.status?.toUpperCase() === 'ACTIVE') || myEnr.items[0];
            if (active) id = active.courseId;
          }
        } catch {}
      }

      // Vét cạn qua orderApi
      if (!id && paymentResult?.orderId) {
        try {
          const rawOrderId = paymentResult.orderId.split('_')[0];
          const order = await orderApi.getOrderDetail(rawOrderId);
          if (order?.items?.[0]?.courseId) id = order.items[0].courseId;
        } catch {}
      }

      if (!id) {
        setErrorMessage('Không xác định được khóa học. Đang chuyển về Trang chủ...');
        setTimeout(() => navigate('/'), 1500);
        return;
      }

      clearPendingPurchase();
      navigate(`/learn/${id}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Có lỗi khi vào phòng học.');
    } finally {
      setIsResolving(false);
    }
  };

  if (!paymentResult) {
    return (
      <div className="max-w-md mx-auto my-24 p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
        <p className="text-sm text-slate-600">Không có dữ liệu giao dịch cần hiển thị.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition cursor-pointer"
        >
          Về Trang Chủ
        </button>
      </div>
    );
  }

  return (
    <PaymentResultView
      result={paymentResult}
      courseTitle={resolvedCourse?.title || 'Khóa học của bạn'}
      courseId={resolvedCourseId}
      onStartLearning={(cId) => void handleStartLearning(cId)}
      accessError={errorMessage}
      onRetry={() => {
        clearPendingPurchase();
        navigate(resolvedCourseId ? `/courses/${resolvedCourseId}` : '/');
      }}
      onBackHome={() => {
        clearPendingPurchase();
        navigate('/');
      }}
    />
  );
}

/** Wrapper Studio Giảng viên: /instructor/courses/:courseId */
function InstructorStudioWrapper({
  ensureCourseDetail,
}: {
  ensureCourseDetail: (c: Course | string) => Promise<Course>;
}) {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setLoading(true);

    ensureCourseDetail(courseId)
      .then((detail) => {
        if (!cancelled) setCourse(detail);
      })
      .catch((err) => {
        console.error('Không tải được studio khóa học:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, ensureCourseDetail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-32 text-sm text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        Đang nạp dữ liệu Studio Giảng viên...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-xl mx-auto my-16 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-700 space-y-3">
        <span>Không tìm thấy thông tin khóa học giảng dạy.</span>
        <div>
          <button
            onClick={() => navigate('/instructor')}
            className="px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer"
          >
            Về danh sách khóa học giảng viên
          </button>
        </div>
      </div>
    );
  }

  return (
    <InstructorStudio
      course={course}
      onEnterLearningRoom={(c) => navigate(`/learn/${c.id}?preview=true`)}
      onBackToCourseList={() => navigate('/instructor')}
      onBackToLearner={() => navigate('/')}
    />
  );
}

/** Wrapper trang xác thực chứng chỉ công khai: /verify hoặc /verify/:hash */
function PublicVerifyWrapper({
  setCertificateForPreview,
  setShowCertificateModal,
  showCertificateModal,
  certificateToShow,
  handleOpenPublicVerify,
}: {
  setCertificateForPreview: (c: Certificate | null) => void;
  setShowCertificateModal: (show: boolean) => void;
  showCertificateModal: boolean;
  certificateToShow: Certificate | null;
  handleOpenPublicVerify: (hash?: string) => void;
}) {
  const { hash } = useParams<{ hash: string }>();
  const navigate = useNavigate();

  return (
    <>
      <PublicVerifyView
        hash={hash || ''}
        onBackToApp={() => navigate('/')}
        onOpenCertificatePreview={(found) => {
          setCertificateForPreview(found);
          setShowCertificateModal(true);
        }}
      />
      {showCertificateModal && certificateToShow && (
        <CertificateView
          certificate={certificateToShow}
          onClose={() => setShowCertificateModal(false)}
          onOpenPublicVerify={handleOpenPublicVerify}
        />
      )}
    </>
  );
}
