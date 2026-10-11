import React, { useCallback, useEffect, useState } from 'react';
import type { 
  Course, 
  InstructorAnalyticsOverview, 
  CourseRevenueBreakdown, 
  InstructorWalletBalance, 
  PayoutRequest 
} from '../../types';
import courseApi, { type CategoryDto } from '../../api/courseApi';
import instructorAnalyticsApi from '../../api/instructorAnalyticsApi';
import payoutApi from '../../api/payoutApi';
import { securityApi } from '../../api/securityApi';
import { CourseThumbnail } from '../common/CourseThumbnail';
import { FinancialPinModal } from '../security/FinancialPinModal';
import { UserSecuritySettingsModal } from '../security/UserSecuritySettingsModal';
import { formatVND } from '../../utils/format';
import { 
  AlertCircle, 
  AlertTriangle, 
  ArrowLeft, 
  BarChart3, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  DollarSign, 
  KeyRound, 
  Layers, 
  Loader2, 
  Lock, 
  Plus, 
  RefreshCw, 
  Send, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Video, 
  Wallet, 
  X 
} from 'lucide-react';

interface InstructorCourseManagerProps {
  onSelectCourse: (course: Course) => void;
  onBackToLearner: () => void;
}

const DEFAULT_CATEGORIES: CategoryDto[] = [
  { id: 'c_lap_trinh', name: 'Lập trình & Kỹ thuật phần mềm', slug: 'lap-trinh' },
  { id: 'c_web', name: 'Phát triển Web (Frontend & Backend)', slug: 'phat-trien-web' },
  { id: 'c_thiet_ke', name: 'Thiết kế Giao diện UI/UX & Đồ họa', slug: 'thiet-ke-ui-ux' },
  { id: 'c_data_ai', name: 'Khoa học Dữ liệu & Trí tuệ Nhân tạo', slug: 'khoa-hoc-du-lieu' },
  { id: 'c_devops', name: 'DevOps & Điện toán Đám mây (Cloud)', slug: 'devops-cloud' },
  { id: 'c_mobile', name: 'Lập trình Di động (iOS & Android)', slug: 'lap-trinh-di-dong' },
];

const makeSlug = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  DRAFT: { label: 'Bản nháp', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  PENDING: { label: 'Chờ duyệt', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  PUBLISHED: { label: 'Đã xuất bản', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  REJECTED: { label: 'Bị từ chối', badge: 'bg-rose-50 text-rose-800 border-rose-200' },
};

export const InstructorCourseManager: React.FC<InstructorCourseManagerProps> = ({
  onSelectCourse,
  onBackToLearner,
}) => {
  // Navigation Tabs: 'courses' | 'analytics' | 'wallet' | 'security'
  const [activeTab, setActiveTab] = useState<'courses' | 'analytics' | 'wallet' | 'security'>('courses');

  // Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>(DEFAULT_CATEGORIES);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseError, setCourseError] = useState<string | null>(null);

  // Create Course Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(DEFAULT_CATEGORIES[0].id);
  const [price, setPrice] = useState('0');
  const [description, setDescription] = useState('');
  const [savingCourse, setSavingCourse] = useState(false);

  // Analytics & Breakdown State
  const [analyticsOverview, setAnalyticsOverview] = useState<InstructorAnalyticsOverview | null>(null);
  const [courseBreakdown, setCourseBreakdown] = useState<CourseRevenueBreakdown[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [searchBreakdown, setSearchBreakdown] = useState('');

  // Wallet & Payout State
  const [walletBalance, setWalletBalance] = useState<InstructorWalletBalance | null>(null);
  const [payoutList, setPayoutList] = useState<PayoutRequest[]>([]);
  const [payoutAmount, setPayoutAmount] = useState('500000');
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');

  // Step-up PIN & Security State
  const [financialSessionActive, setFinancialSessionActive] = useState(false);
  const [financialRemaining, setFinancialRemaining] = useState(0);
  const [hasPin, setHasPin] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSecuritySettingsOpen, setIsSecuritySettingsOpen] = useState(false);

  // 1. Check Security Status
  const checkFinancialStatus = useCallback(async () => {
    try {
      const res = await securityApi.getStatus();
      const data = res.data;
      setHasPin(Boolean(data?.hasPin));
      setFinancialSessionActive(Boolean(data?.financialSessionActive));
      setFinancialRemaining(data?.remainingSeconds || 0);
      return data;
    } catch {
      return null;
    }
  }, []);

  // 2. Load Courses & Categories
  const loadCoursesData = useCallback(async () => {
    setLoadingCourses(true);
    setCourseError(null);
    try {
      const [page, categoryList] = await Promise.all([
        courseApi.getMyCourses({ size: 100 }),
        courseApi.getCategories().catch(() => DEFAULT_CATEGORIES),
      ]);
      setCourses(page.items);
      const combinedCategories = categoryList && categoryList.length > 0 ? categoryList : DEFAULT_CATEGORIES;
      setCategories(combinedCategories);
      setCategoryId(prev => prev || combinedCategories[0]?.id || DEFAULT_CATEGORIES[0].id);
    } catch (err: any) {
      setCourseError(err?.message || 'Không tải được danh sách khóa học của bạn.');
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  // 3. Load Analytics & Revenue Breakdown
  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const [overview, breakdown] = await Promise.all([
        instructorAnalyticsApi.getOverview(),
        instructorAnalyticsApi.getCourseBreakdown(),
      ]);
      setAnalyticsOverview(overview);
      setCourseBreakdown(breakdown);
    } catch (err: any) {
      setAnalyticsError(err?.message || 'Không thể tải số liệu thống kê doanh thu.');
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  // 4. Load Wallet & Payout Requests
  const loadWalletData = useCallback(async () => {
    setLoadingWallet(true);
    setPayoutError(null);
    try {
      const [balanceRes, payoutsRes] = await Promise.all([
        payoutApi.getMyBalance(),
        payoutApi.getMyPayoutRequests({ page: 0, size: 20 }),
      ]);
      setWalletBalance(balanceRes);
      setPayoutList(payoutsRes.items);
    } catch (err: any) {
      setPayoutError(err?.message || 'Không thể tải thông tin ví và lịch sử rút tiền.');
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  // Countdown timer for Financial Session
  useEffect(() => {
    let timer: any;
    if (financialSessionActive && financialRemaining > 0) {
      timer = setTimeout(() => {
        setFinancialRemaining(prev => {
          if (prev <= 1) {
            setFinancialSessionActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [financialSessionActive, financialRemaining]);

  // Initial load
  useEffect(() => {
    void loadCoursesData();
    void checkFinancialStatus();
  }, [loadCoursesData, checkFinancialStatus]);

  // Tab switch effect
  useEffect(() => {
    if (activeTab === 'analytics') {
      void loadAnalytics();
    } else if (activeTab === 'wallet') {
      checkFinancialStatus().then(status => {
        if (status?.financialSessionActive) {
          void loadWalletData();
        } else {
          setIsPinModalOpen(true);
        }
      });
    }
  }, [activeTab, checkFinancialStatus, loadAnalytics, loadWalletData]);

  // Financial Session Unlocked
  const handleFinancialUnlocked = useCallback(() => {
    setFinancialSessionActive(true);
    setFinancialRemaining(15 * 60);
    void loadWalletData();
  }, [loadWalletData]);

  // Lock Wallet Session
  const handleLockFinancialSession = async () => {
    try {
      await securityApi.lockSession();
    } catch {
      // Ignore
    }
    setFinancialSessionActive(false);
    setFinancialRemaining(0);
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Submit Create Course Form
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;
    setSavingCourse(true);
    setCourseError(null);
    try {
      const created = await courseApi.createCourse({
        title: title.trim(),
        slug: makeSlug(title),
        categoryId,
        description: description.trim(),
        basePrice: Math.max(0, Number(price) || 0),
        currencyCode: 'VND',
        level: 'BEGINNER',
      });
      setCourses(current => [created, ...current]);
      setFormOpen(false);
      setTitle('');
      setPrice('0');
      setDescription('');
      onSelectCourse(created);
    } catch (err: any) {
      setCourseError(err?.message || 'Không tạo được khóa học.');
    } finally {
      setSavingCourse(false);
    }
  };

  // Create Payout Request
  const handleCreatePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(payoutAmount);
    if (isNaN(amountNum) || amountNum < 500000) {
      setPayoutError('Số tiền rút tối thiểu là 500.000 VNĐ theo quy định.');
      return;
    }
    if (walletBalance && walletBalance.availableBalance > 0 && amountNum > walletBalance.availableBalance) {
      setPayoutError(`Số dư khả dụng (${formatVND(walletBalance.availableBalance)}) không đủ để tạo yêu cầu này.`);
      return;
    }

    setPayoutSubmitting(true);
    setPayoutError(null);
    setPayoutSuccessMsg('');
    try {
      await payoutApi.createPayoutRequest(amountNum);
      setPayoutSuccessMsg(`Đã tạo lệnh rút ${formatVND(amountNum)} thành công. Số tiền đang chờ Ban quản trị duyệt.`);
      await loadWalletData();
      setTimeout(() => setPayoutSuccessMsg(''), 6000);
    } catch (err: any) {
      setPayoutError(err?.message || 'Không thể tạo yêu cầu rút tiền.');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  // Filtered breakdown list
  const filteredBreakdown = courseBreakdown.filter(item =>
    item.courseTitle.toLowerCase().includes(searchBreakdown.toLowerCase()) ||
    item.courseId.toLowerCase().includes(searchBreakdown.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Top Breadcrumb & Learner Link */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
        <button
          onClick={onBackToLearner}
          className="inline-flex items-center gap-1.5 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại không gian học viên
        </button>
        <span className="text-slate-400 font-mono text-[11px]">Hệ thống Quản lý Giảng viên EduTech LMS</span>
      </div>

      {/* Main Instructor Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider">
                Trung Tâm Giảng Viên
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                Tài khoản xác thực
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Quản Lý Khóa Học, Doanh Thu & Ví Tài Chính
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Tập trung toàn bộ nghiệp vụ giảng dạy: soạn giáo trình, kiểm soát doanh thu từng khóa học, rút tiền về tài khoản ngân hàng và bảo mật 2 lớp bằng mã PIN & OTP.
            </p>
          </div>

          {/* Header Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setFormOpen(true);
                if (!categoryId && categories.length > 0) {
                  setCategoryId(categories[0].id);
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md transition cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Tạo khóa học mới
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2.5 text-xs font-bold text-white border border-white/20 transition cursor-pointer"
            >
              <Wallet className="h-4 w-4 text-amber-300" /> Ví & Rút tiền
            </button>
            <button
              onClick={() => setIsSecuritySettingsOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2.5 text-xs font-bold text-white border border-white/20 transition cursor-pointer"
            >
              <KeyRound className="h-4 w-4 text-indigo-300" /> Bảo mật & Đổi mã PIN
            </button>
          </div>
        </div>

        {/* Financial Session Status Pill if Active */}
        {financialSessionActive && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Phiên làm việc ví tài chính đang mở (Thời gian còn: <strong className="font-mono text-amber-200">{formatCountdown(financialRemaining)}</strong>)</span>
            </div>
            <button
              onClick={handleLockFinancialSession}
              className="text-rose-300 hover:text-rose-200 font-bold text-[11px] hover:underline cursor-pointer"
            >
              Khóa ví ngay
            </button>
          </div>
        )}
      </section>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
        {[
          { id: 'courses', label: 'Khóa học của tôi', icon: BookOpen, count: courses.length },
          { id: 'analytics', label: 'Thống kê & Doanh thu từng khóa', icon: BarChart3 },
          { id: 'wallet', label: 'Ví giảng viên & Rút tiền', icon: Wallet },
          { id: 'security', label: 'Cài đặt mã PIN & Mật khẩu OTP', icon: Lock },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: COURSES MANAGEMENT */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Danh sách khóa học giảng dạy ({courses.length})
              </h2>
              <p className="text-xs text-slate-500">Bấm vào một khóa học để soạn giáo trình, tạo bài giảng và upload video.</p>
            </div>
            <button
              onClick={() => void loadCoursesData()}
              disabled={loadingCourses}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingCourses ? 'animate-spin' : ''}`} /> Làm mới
            </button>
          </div>

          {courseError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{courseError}</span>
            </div>
          )}

          {loadingCourses ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-12 text-xs text-slate-500 shadow-xs">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Đang tải danh sách khóa học...
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Bạn chưa có khóa học nào</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hãy tạo khóa học đầu tiên để bắt đầu xây dựng chương trình giảng dạy và phát triển thu nhập.
              </p>
              <button
                onClick={() => setFormOpen(true)}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-md transition cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Bắt đầu tạo khóa học
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map(course => {
                const statusUpper = (course.status || 'DRAFT').toUpperCase();
                const config = STATUS_CONFIG[statusUpper] || { label: course.status, badge: 'bg-slate-100 text-slate-700 border-slate-200' };

                return (
                  <article key={course.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <CourseThumbnail src={course.thumbnail} alt={course.title} className="aspect-video w-full bg-slate-100 object-cover" />
                      <div className="space-y-3 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${config.badge}`}>
                            {config.label}
                          </span>
                          <span className="text-xs font-bold text-slate-800 font-mono">{formatVND(course.price)}</span>
                        </div>
                        <h3 className="line-clamp-2 min-h-10 font-bold text-slate-900 text-sm leading-snug">{course.title}</h3>
                        <p className="text-xs text-slate-500">{course.category || 'Chung'} · {course.totalLessons} bài học</p>

                        {statusUpper === 'REJECTED' && course.rejectionNote && (
                          <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 flex items-start gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-600" />
                            <div>
                              <p className="font-semibold text-rose-800">Lý do từ chối:</p>
                              <p className="mt-0.5 line-clamp-2">{course.rejectionNote}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <button
                        onClick={() => onSelectCourse(course)}
                        className="w-full rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white hover:bg-indigo-600 transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Vào Studio Soạn Giáo Trình
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ANALYTICS & REVENUE BREAKDOWN */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Thống Kê Doanh Thu Chi Tiết Từng Khóa Học
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Xem rõ doanh thu gộp (học viên thanh toán), phí nền tảng khấu trừ (30%) và doanh thu thực nhận (70%) của từng khóa học.
              </p>
            </div>
            <button
              onClick={() => void loadAnalytics()}
              disabled={loadingAnalytics}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
              Làm mới số liệu
            </button>
          </div>

          {analyticsError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{analyticsError}</span>
            </div>
          )}

          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Tổng học viên</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                {(analyticsOverview?.totalStudents ?? 0).toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-500">+{analyticsOverview?.thisMonthSales ?? 0} lượt mua tháng này</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-2 bg-gradient-to-br from-white to-emerald-50/30">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
                <span>Doanh thu tháng này</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-emerald-700">
                {formatVND(analyticsOverview?.thisMonthRevenue ?? 0)}
              </h3>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="font-bold text-emerald-700">+{analyticsOverview?.growthRate ?? 0}%</span>
                <span className="text-slate-400">so với tháng trước</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Số dư khả dụng</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Wallet className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-[#e74c3c]">
                {formatVND(analyticsOverview?.availableBalance ?? 0)}
              </h3>
              <p className="text-[11px] text-slate-500">Tạm khóa: {formatVND(analyticsOverview?.pendingBalance ?? 0)}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Tổng doanh thu trọn đời</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-black text-indigo-900">
                {formatVND(analyticsOverview?.allTimeRevenue ?? 0)}
              </h3>
              <p className="text-[11px] text-slate-500">Trên {analyticsOverview?.totalCourses ?? courses.length} khóa học</p>
            </div>
          </div>

          {/* Detailed Course Breakdown Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-base text-slate-900">Bảng Kê Doanh Thu Từng Khóa Học</h4>
                <p className="text-xs text-slate-500">Tính toán chính xác phần trăm chia sẻ hoa hồng sau khi trừ chi phí vận hành nền tảng.</p>
              </div>
              <input
                type="text"
                value={searchBreakdown}
                onChange={e => setSearchBreakdown(e.target.value)}
                placeholder="Tìm theo tên khóa học..."
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 w-full sm:w-64"
              />
            </div>

            {loadingAnalytics ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-xs">Đang tổng hợp báo cáo doanh thu từ máy chủ...</span>
              </div>
            ) : filteredBreakdown.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                Chưa có dữ liệu phát sinh doanh thu cho các khóa học của bạn.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Khóa học</th>
                      <th className="p-3">Giá niêm yết</th>
                      <th className="p-3 text-center">Lượt bán</th>
                      <th className="p-3">Doanh thu gộp</th>
                      <th className="p-3">Phí sàn (30%)</th>
                      <th className="p-3 text-right">Thực nhận (70%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredBreakdown.map(item => (
                      <tr key={item.courseId} className="hover:bg-slate-50/80 transition">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{item.courseTitle}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {item.courseId}</p>
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {formatVND(item.basePrice)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                            {item.salesCount} đơn
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {formatVND(item.grossRevenue)}
                        </td>
                        <td className="p-3 text-rose-600 font-medium">
                          -{formatVND(item.platformFee)}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-700 text-sm">
                          {formatVND(item.netRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                    <tr>
                      <td className="p-3" colSpan={2}>Tổng cộng:</td>
                      <td className="p-3 text-center">
                        {filteredBreakdown.reduce((sum, i) => sum + i.salesCount, 0)} đơn
                      </td>
                      <td className="p-3">
                        {formatVND(filteredBreakdown.reduce((sum, i) => sum + i.grossRevenue, 0))}
                      </td>
                      <td className="p-3 text-rose-600">
                        -{formatVND(filteredBreakdown.reduce((sum, i) => sum + i.platformFee, 0))}
                      </td>
                      <td className="p-3 text-right text-emerald-700 text-sm font-black">
                        {formatVND(filteredBreakdown.reduce((sum, i) => sum + i.netRevenue, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: WALLET & PAYOUTS */}
      {activeTab === 'wallet' && (
        !financialSessionActive ? (
          <div className="bg-white p-12 rounded-3xl border border-amber-200 text-center max-w-lg mx-auto space-y-4 shadow-sm animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Khu Vực Quản Lý Tiền Đang Được Khóa</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Để bảo vệ an toàn cho doanh thu và tài khoản ngân hàng của giảng viên, vui lòng nhập mã PIN bảo mật cấp 2 để mở khóa phiên làm việc (15 phút).
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(true)}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                {hasPin ? 'Mở Khóa Bằng Mã PIN Ví' : 'Thiết Lập Mã PIN Lần Đầu'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Session status banner */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-900 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Phiên bảo mật ví đang hoạt động (Thời gian còn: <strong className="font-mono text-amber-950 font-bold">{formatCountdown(financialRemaining)}</strong>)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSecuritySettingsOpen(true)}
                  className="px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-amber-100 rounded-lg transition font-semibold cursor-pointer text-[11px]"
                >
                  Đổi PIN / Mật khẩu
                </button>
                <button
                  type="button"
                  onClick={handleLockFinancialSession}
                  className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition font-bold cursor-pointer text-[11px]"
                >
                  Khóa ví ngay
                </button>
              </div>
            </div>

            {/* Wallet Balance KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Số dư khả dụng</span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Wallet className="w-4 h-4" /></div>
                </div>
                <p className="text-2xl font-black text-emerald-700">{formatVND(walletBalance?.availableBalance ?? 0)}</p>
                <p className="text-[11px] text-slate-500 mt-1">Có thể tạo lệnh rút tiền ngay</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Đang chờ rút</span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Clock className="w-4 h-4" /></div>
                </div>
                <p className="text-2xl font-black text-amber-700">{formatVND(walletBalance?.blockedBalance ?? 0)}</p>
                <p className="text-[11px] text-slate-500 mt-1">Đang tạm khóa trong lệnh rút</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Chờ giải phóng</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><DollarSign className="w-4 h-4" /></div>
                </div>
                <p className="text-2xl font-black text-blue-700">{formatVND(walletBalance?.pendingBalance ?? 0)}</p>
                <p className="text-[11px] text-slate-500 mt-1">Doanh thu tạm giữ đối soát</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Tổng số dư ví</span>
                  <div className="p-2 bg-slate-50 text-slate-600 rounded-xl"><CreditCard className="w-4 h-4" /></div>
                </div>
                <p className="text-2xl font-black text-slate-800">{formatVND(walletBalance?.actualBalance ?? 0)}</p>
                <p className="text-[11px] text-slate-500 mt-1">Thực tế trong tài khoản</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form tạo lệnh rút */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" /> Tạo Yêu Cầu Rút Tiền
                </h3>

                {payoutSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-medium flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{payoutSuccessMsg}</span>
                  </div>
                )}

                {payoutError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{payoutError}</span>
                  </div>
                )}

                <form onSubmit={handleCreatePayoutRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số tiền cần rút (VNĐ):
                    </label>
                    <input
                      type="number"
                      min="500000"
                      step="10000"
                      value={payoutAmount}
                      onChange={e => setPayoutAmount(e.target.value)}
                      placeholder="Tối thiểu 500,000"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[500000, 1000000, 2000000, 5000000].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setPayoutAmount(String(val))}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
                        >
                          +{formatVND(val)}
                        </button>
                      ))}
                      {walletBalance && walletBalance.availableBalance >= 500000 && (
                        <button
                          type="button"
                          onClick={() => setPayoutAmount(String(walletBalance.availableBalance))}
                          className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold transition cursor-pointer"
                        >
                          Rút tất cả
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-700">Tài khoản nhận tiền:</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Hệ thống tự động giải ngân về tài khoản ngân hàng chính đã đăng ký trong hồ sơ giảng viên của bạn sau khi Admin duyệt.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={payoutSubmitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {payoutSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang gửi yêu cầu...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Gửi Lệnh Rút Tiền
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Bảng lịch sử yêu cầu rút */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Lịch Sử Yêu Cầu Rút Tiền</h3>
                    <p className="text-xs text-slate-500">Theo dõi tiến độ duyệt chi và thông tin giải ngân.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadWalletData()}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                  >
                    Làm mới
                  </button>
                </div>

                {loadingWallet ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    <span className="text-xs">Đang tải lịch sử rút tiền...</span>
                  </div>
                ) : payoutList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-xs font-medium">Chưa có yêu cầu rút tiền nào.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[500px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="p-3">Mã GD</th>
                          <th className="p-3">Số tiền</th>
                          <th className="p-3">Ngân hàng</th>
                          <th className="p-3">Trạng thái</th>
                          <th className="p-3">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payoutList.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-mono text-[11px] text-slate-500">{item.id}</td>
                            <td className="p-3 font-bold text-emerald-700 text-sm">
                              {formatVND(item.amount)}
                            </td>
                            <td className="p-3 text-slate-600">
                              <div>{item.bankName}</div>
                              {item.bankAccount && (
                                <div className="font-mono text-[11px] text-slate-500">
                                  {item.bankAccount} {item.bankOwner ? `(${item.bankOwner})` : ''}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'APPROVED' || item.status === 'SUCCESS'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : item.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {item.status === 'APPROVED' || item.status === 'SUCCESS'
                                  ? 'Đã duyệt chi'
                                  : item.status === 'REJECTED'
                                  ? 'Bị từ chối'
                                  : 'Chờ Admin duyệt'}
                              </span>
                              {item.rejectReason && (
                                <p className="text-[10px] text-rose-600 mt-1">Lý do: {item.rejectReason}</p>
                              )}
                              {item.bankReferenceNo && (
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Số GD: {item.bankReferenceNo}</p>
                              )}
                            </td>
                            <td className="p-3 text-slate-500 text-[11px]">{item.requestedAt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* TAB 4: SECURITY SETTINGS */}
      {activeTab === 'security' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs max-w-2xl space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Cài Đặt Bảo Mật Giảng Viên & Xác Thực 2 Bước
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Quản lý mã PIN ví tài chính và đổi mật khẩu an toàn thông qua mã xác thực OTP gửi về Email.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  Mã PIN Bảo Mật Cấp 2 (Ví Tài Chính)
                </p>
                <p className="text-[11px] text-slate-500">
                  {hasPin ? 'Đã kích hoạt. Yêu cầu nhập mã 6 số khi truy cập trang rút tiền.' : 'Chưa thiết lập mã PIN ví.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSecuritySettingsOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {hasPin ? 'Đổi mã PIN' : 'Thiết lập ngay'}
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  Đổi Mật Khẩu Tài Khoản (Qua Email OTP)
                </p>
                <p className="text-[11px] text-slate-500">
                  Mã OTP sẽ được gửi về email đăng ký để xác thực trước khi đổi mật khẩu mới.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSecuritySettingsOpen(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Đổi mật khẩu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COURSE MODAL (FIXED NO COLLAPSE, BEAUTIFUL UX) */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Tạo Khóa Học Mới</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Khởi tạo bản nháp khóa học để bắt đầu xây dựng giáo trình</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <label className="block text-xs font-bold text-slate-700 space-y-1">
                Tên khóa học <span className="text-rose-500">*</span>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ví dụ: Lập trình Java Spring Boot Microservices từ A-Z"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-xs font-bold text-slate-700 space-y-1">
                  Danh mục khóa học <span className="text-rose-500">*</span>
                  <select
                    required
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-bold text-slate-700 space-y-1">
                  Giá niêm yết (VNĐ)
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-slate-700 space-y-1">
                Mô tả ngắn gọn
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Mục tiêu kiến thức đạt được và nội dung khóa học..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </label>

              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 space-y-0.5">
                <p className="font-bold">Lưu ý sau khi tạo:</p>
                <p className="text-[11px] text-indigo-800">
                  Khóa học sẽ ở trạng thái Bản nháp (DRAFT). Bạn sẽ được chuyển ngay vào Studio để thêm các chương, bài giảng video hoặc trắc nghiệm trước khi gửi duyệt.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingCourse || !title.trim() || !categoryId}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {savingCourse && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Tạo bản nháp & Vào Studio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step-up Security Modals */}
      <FinancialPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handleFinancialUnlocked}
        hasPin={hasPin}
        onPinCreated={() => setHasPin(true)}
      />

      <UserSecuritySettingsModal
        isOpen={isSecuritySettingsOpen}
        onClose={() => setIsSecuritySettingsOpen(false)}
        onSecurityUpdated={() => void checkFinancialStatus()}
      />
    </div>
  );
};

export default InstructorCourseManager;
