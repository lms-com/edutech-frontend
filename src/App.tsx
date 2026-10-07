import { useState, useEffect, useCallback } from 'react';
import type { PortalType, Course, Certificate, NotificationItem } from './types';
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
import type { VNPayPaymentResult } from './types';
import courseApi from './api/courseApi';
import notificationApi from './api/notificationApi';
import { mapCertificate } from './api/mappers/notificationMapper';
import enrollmentApi, { type EnrollmentDto } from './api/enrollmentApi';
import { Loader2, AlertCircle, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentPortal, setCurrentPortal] = useState<PortalType>('learner');
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [selectedInstructorCourse, setSelectedInstructorCourse] = useState<Course | null>(null);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [myEnrollments, setMyEnrollments] = useState<EnrollmentDto[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [courseCache, setCourseCache] = useState<Record<string, Course>>({});
  const [paymentCourse, setPaymentCourse] = useState<Course | null>(null);
  const [activeEnrollment, setActiveEnrollment] = useState<EnrollmentDto | null>(null);
  const [paymentResult, setPaymentResult] = useState<VNPayPaymentResult | null>(null);
  const [isInLearningRoom, setIsInLearningRoom] = useState<boolean>(false);
  const [isLearningPreview, setIsLearningPreview] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState<boolean>(false);
  const [publicVerifyHash, setPublicVerifyHash] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  /** Chứng chỉ đang xem trước, chọn từ trang xác thực công khai. */
  const [certificateForPreview, setCertificateForPreview] = useState<Certificate | null>(null);

  const fetchCurrentUser = useAuthStore(state => state.fetchCurrentUser);
  const currentUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Khôi phục phiên đăng nhập từ token đã lưu để F5 không mất đăng nhập
  useEffect(() => {
    void fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Signing out or a 401 must return staff portals to the learner shell and
  // drop any cached access to a course that was open before the session ended.
  useEffect(() => {
    if (isAuthenticated) return;
    setCurrentPortal('learner');
    setSelectedInstructorCourse(null);
    setActiveCourse(null);
    setActiveEnrollment(null);
    setIsInLearningRoom(false);
    setIsLearningPreview(false);
    setDetailCourse(null);
    setPaymentCourse(null);
    setPaymentResult(null);
    setMyEnrollments([]);
    setShowCertificateModal(false);
  }, [isAuthenticated]);

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
    if (portal !== 'instructor') setSelectedInstructorCourse(null);
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

  const loadMyEnrollments = useCallback(async () => {
    if (!isAuthenticated) {
      setMyEnrollments([]);
      setEnrollmentsLoading(false);
      return;
    }
    setEnrollmentsLoading(true);
    try {
      const page = await enrollmentApi.getMyEnrollments({ size: 100 });
      setMyEnrollments(page.items);
    } catch (err) {
      // Không suy diễn rằng người dùng có quyền học khi chưa xác nhận được enrollment.
      setMyEnrollments([]);
      console.warn('Không tải được danh sách khóa học đã ghi danh:', err);
    } finally {
      setEnrollmentsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadMyEnrollments();
  }, [loadMyEnrollments]);

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

  const openCourseDetail = async (courseOrId: Course | string) => {
    setDetailError(null);
    setDetailLoading(true);
    try {
      if (typeof courseOrId === 'string') {
        const cached = courseCache[courseOrId];
        if (cached) {
          setDetailCourse(cached);
        } else {
          const detail = await courseApi.getCourseById(courseOrId);
          setCourseCache(prev => ({ ...prev, [detail.id]: detail }));
          setDetailCourse(detail);
        }
      } else {
        setDetailCourse(courseOrId);
        setDetailCourse(await ensureCourseDetail(courseOrId));
      }
    } catch (err: any) {
      // API chi tiết khóa học yêu cầu đăng nhập, nên 401 là trường hợp hay gặp nhất
      setDetailError(err?.code === 401
        ? 'Bạn cần đăng nhập để xem chi tiết khóa học này.'
        : err?.message || 'Không tải được chi tiết khóa học.');
    } finally {
      setDetailLoading(false);
    }
  };

  const pollEnrollmentActive = async (
    courseId: string,
    maxRetries = 5,
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

  const enterLearningRoom = async (course: Course, options: { preview?: boolean } = {}): Promise<boolean> => {
    if (!options.preview && !isAuthenticated) {
      setIsAuthModalOpen(true);
      return false;
    }
    try {
      // Chỉ enrollment ACTIVE mới được vào học; preview của staff là chế độ chỉ xem.
      let enrollment: EnrollmentDto | null = null;
      if (!options.preview) {
        enrollment = await pollEnrollmentActive(course.id);
        if (!enrollment || enrollment.status?.toUpperCase() !== 'ACTIVE') {
          setCoursesError('Khóa học chưa được kích hoạt. Hãy hoàn tất thanh toán và chờ hệ thống ghi danh thành công.');
          return false;
        }
        setMyEnrollments(prev => [enrollment!, ...prev.filter(item => item.courseId !== course.id)]);
      }
      // Chỉ tải cấu trúc chương/bài sau khi xác minh quyền học.
      setActiveCourse(await ensureCourseDetail(course));
      setActiveEnrollment(enrollment);
      setIsLearningPreview(!!options.preview);
      setIsInLearningRoom(true);
      setCoursesError(null);
      return true;
    } catch (err: any) {
      setCoursesError(err?.message || 'Không mở được phòng học.');
      return false;
    }
  };

  const enrollInFreeCourse = async (course: Course) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const enrollment = await enrollmentApi.enrollInFreeCourse(course.id);
    setMyEnrollments(prev => [enrollment, ...prev.filter(item => item.courseId !== course.id)]);
    await enterLearningRoom(course);
  };

  const selectInstructorCourse = async (course: Course) => {
    try {
      setSelectedInstructorCourse(await ensureCourseDetail(course));
    } catch (err: any) {
      setCoursesError(err?.message || 'Không tải được nội dung khóa học.');
      setSelectedInstructorCourse(course);
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

  // 2. Thông báo: nạp khi đã đăng nhập, và nạp lại khi phiên đăng nhập đổi
  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications, isAuthenticated]);

  /**
   * 3. Luồng SSE realtime.
   * EventSource không gửi được header Authorization nên backend nhận định danh qua
   * query param userId — trước đây gửi token nên luôn bị 400 và chuông không cập nhật.
   */
  useEffect(() => {
    if (!currentUser?.id) return;

    const eventSource = new EventSource(notificationApi.getSseUrl(currentUser.id));

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Sự kiện INIT chỉ là mở kết nối, không phải thông báo mới
        if (!data?.title) return;
        setNotifications(prev => [
          {
            id: data.id ?? `sse_${Date.now()}`,
            title: data.title,
            message: data.content ?? '',
            type: data.type ?? '',
            timestamp: 'Vừa xong',
            isRead: false,
          },
          ...prev,
        ]);
      } catch {
        // Bỏ qua sự kiện không parse được
      }
    };

    eventSource.onerror = () => {
      // EventSource tự thử kết nối lại; chỉ ghi log để không làm phiền người dùng
      console.warn('Luồng thông báo realtime gián đoạn, đang thử kết nối lại...');
    };

    return () => eventSource.close();
  }, [currentUser?.id]);

  // 4. Chứng chỉ của tôi (cần đăng nhập)
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

  // 3. Tự động phát hiện và xử lý kết quả thanh toán từ VNPay Callback URL
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const result = parseVNPayCallback(window.location.search);
      if (result) {
        setPaymentResult(result);
        cleanUrlQueryParams();

        if (result.isSuccess) {
          void loadMyEnrollments();
        }

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
  }, [loadMyEnrollments]);

  /**
   * Điểm vào cho link QR trên chứng chỉ: /?verify=<qrCodeHash>
   * Không có router nên đọc thẳng query param để mở trang xác thực công khai.
   */
  useEffect(() => {
    const verifyHash = new URLSearchParams(window.location.search).get('verify');
    if (!verifyHash) return;
    setPublicVerifyHash(verifyHash);
    setCurrentPortal('public_verify');
    cleanUrlQueryParams();
  }, []);

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

  /** Chứng chỉ đang xét: ưu tiên khóa đang học, nếu không lấy cái mới nhất. */
  const activeCertificate = certificates.find(cert => cert.courseId === activeCourse?.id)
    ?? certificates[0]
    ?? null;

  const certificateToShow = certificateForPreview ?? activeCertificate;

  const handleOpenCertificate = async () => {
    // Mở từ header thì bỏ chứng chỉ đang xem trước, quay về chứng chỉ của chính mình
    setCertificateForPreview(null);
    setShowCertificateModal(true);

    let cert = activeCertificate;
    if (!cert && isAuthenticated && activeCourse) {
      const refreshed = await loadCertificates();
      cert = refreshed.find(c => c.courseId === activeCourse.id) ?? refreshed[0] ?? null;
    }

    if (cert) {
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.4 } });
      } catch {
        // Bỏ qua nếu trình duyệt không hỗ trợ
      }
    }
  };

  const handleOpenPublicVerify = (hash?: string) => {
    setPublicVerifyHash(hash ?? activeCertificate?.qrCodeHash ?? '');
    setCurrentPortal('public_verify');
    setShowCertificateModal(false);
  };

  // Nếu đang ở trang xác thực chứng chỉ công khai (Không cần đăng nhập, toàn màn hình)
  if (currentPortal === 'public_verify') {
    return (
      <>
        <PublicVerifyView
          hash={publicVerifyHash}
          onBackToApp={() => setCurrentPortal('learner')}
          onOpenCertificatePreview={(found) => {
            setCertificateForPreview(found);
            setShowCertificateModal(true);
          }}
        />
        {/* Modal phải render ngay trong nhánh này, nếu không nút xem bản gốc sẽ không mở được gì */}
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

  // Nếu đang trong phòng học LMS (Cinema Mode Layout)
  if (isInLearningRoom && activeCourse) {
    return (
      <LearningLayout
        courseTitle={activeCourse.title}
        progressPercent={activeEnrollment?.completedRate ?? 0}
        onBack={() => { setIsInLearningRoom(false); setIsLearningPreview(false); }}
        onOpenCertificate={handleOpenCertificate}
      >
        <LearningRoom
          course={activeCourse}
          enrollment={activeEnrollment}
          previewMode={isLearningPreview}
          onBack={() => { setIsInLearningRoom(false); setIsLearningPreview(false); }}
          onOpenCertificate={handleOpenCertificate}
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

  // Shared handlers for Header across layouts
  const sharedHeaderProps = {
    currentPortal,
    onSelectPortal: handleSelectPortal,
    onOpenLearningRoom: () => {
      if (activeCourse) {
        void enterLearningRoom(activeCourse, {
          preview: currentPortal === 'instructor' || currentPortal === 'admin',
        });
      }
    },
    onOpenCertificate: handleOpenCertificate,
    onOpenPublicVerify: () => handleOpenPublicVerify(),
    notifications,
    onMarkAllAsRead: handleMarkAllAsRead,
    onMarkAsRead: handleMarkAsRead,
    onSelectNotification: (item: NotificationItem) => {
      if (item.type === 'CERTIFICATE') {
        handleOpenCertificate();
      }
    },
    onOpenAuthModal: () => setIsAuthModalOpen(true),
    onOpenOrderHistory: () => setShowOrderHistoryModal(true),
  };

  return (
    <>
      {/* 1. Phân hệ Giảng viên (Instructor Studio) */}
      {currentPortal === 'instructor' && (
        <InstructorLayout {...sharedHeaderProps}>
          {selectedInstructorCourse ? (
            <InstructorStudio
              course={selectedInstructorCourse}
              onEnterLearningRoom={(course) => enterLearningRoom(course, { preview: true })}
              onBackToCourseList={() => setSelectedInstructorCourse(null)}
            />
          ) : (
            <InstructorCourseManager
              onSelectCourse={selectInstructorCourse}
              onBackToLearner={() => handleSelectPortal('learner')}
            />
          )}
        </InstructorLayout>
      )}

      {/* 2. Phân hệ Quản trị viên (Admin Portal) */}
      {currentPortal === 'admin' && (
        <AdminLayout {...sharedHeaderProps} onBackToLearner={() => handleSelectPortal('learner')}>
          <AdminPortal
            onPreviewCourse={(course) => enterLearningRoom(course, { preview: true })}
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
              courseId={paymentCourse?.id || getPendingPurchase() || ''}
              onStartLearning={async (courseId?: string) => {
                let courseToEnter = paymentCourse;
                if (!courseToEnter) {
                  const targetId = courseId || getPendingPurchase();
                  if (targetId) {
                    courseToEnter = coursesList.find(c => c.id === targetId) || null;
                    if (!courseToEnter) {
                      try {
                        courseToEnter = await courseApi.getCourseById(targetId);
                      } catch (err) {
                        console.warn('Không tải được thông tin khóa học:', err);
                      }
                    }
                  }
                }
                if (courseToEnter) {
                  const entered = await enterLearningRoom(courseToEnter);
                  if (entered) {
                    clearPendingPurchase();
                    setPaymentResult(null);
                    setDetailCourse(null);
                  }
                }
              }}
              accessError={coursesError}
              onRetry={() => {
                setPaymentResult(null);
                clearPendingPurchase();
              }}
              onBackHome={() => {
                setPaymentResult(null);
                setPaymentCourse(null);
                setDetailCourse(null);
                clearPendingPurchase();
                void loadMyEnrollments();
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
                isEnrolled={myEnrollments.some(item => item.courseId === detailCourse.id && item.status?.toUpperCase() === 'ACTIVE')}
                onBack={() => setDetailCourse(null)}
                onStartLearning={enterLearningRoom}
                onEnrollFreeCourse={enrollInFreeCourse}
                onSelectRelatedCourse={openCourseDetail}
              />
            )
          ) : (
            <CourseCatalog
              courses={coursesList}
              enrollments={myEnrollments}
              enrollmentsLoading={enrollmentsLoading}
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
      {showCertificateModal && certificateToShow && (
        <CertificateView
          certificate={certificateToShow}
          onClose={() => setShowCertificateModal(false)}
          onOpenPublicVerify={handleOpenPublicVerify}
        />
      )}

      {showCertificateModal && !certificateToShow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center space-y-3">
            <Award className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-[#2c3e50]">Bạn chưa có chứng chỉ nào</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Chứng chỉ được cấp khi bạn hoàn thành 100% bài học của một khóa học đã ghi danh.
            </p>
            <button
              onClick={() => setShowCertificateModal(false)}
              className="px-4 py-2 rounded-xl bg-[#2c3e50] hover:bg-[#1a252f] text-white text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
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
          openCourseDetail(courseId);
        }}
      />
    </>
  );
}
