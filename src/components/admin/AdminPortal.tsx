import React, { useCallback, useEffect, useState } from 'react';
import type { Course, PayoutRequest } from '../../types';
import courseApi from '../../api/courseApi';
import payoutApi from '../../api/payoutApi';
import { securityApi } from '../../api/securityApi';
import { FinancialPinModal } from '../security/FinancialPinModal';
import { UserSecuritySettingsModal } from '../security/UserSecuritySettingsModal';
import { AdminCourseModerationTab } from './panels/AdminCourseModerationTab';
import { AdminInstructorAppsTab } from './panels/AdminInstructorAppsTab';
import { AdminUserManagementTab } from './panels/AdminUserManagementTab';
import { AdminCertificatesTab } from './panels/AdminCertificatesTab';
import { AdminPayoutsTab } from './panels/AdminPayoutsTab';
import { AdminDevicesTab } from './panels/AdminDevicesTab';
import { AdminRefundsTab } from './panels/AdminRefundsTab';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Check,
  DollarSign,
  FileText,
  RefreshCw,
  RotateCcw,
  Shield,
  Smartphone,
  Users,
  Video,
} from 'lucide-react';

interface AdminPortalProps {
  onPreviewCourse: (course: Course) => void;
  onBackToLearner?: () => void;
}

type AdminTabId = 'courses' | 'instructors' | 'users' | 'certificates' | 'payouts' | 'devices' | 'refunds';

export const AdminPortal: React.FC<AdminPortalProps> = ({ onPreviewCourse, onBackToLearner }) => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('courses');
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Tab badge & KPI summary counts
  const [pendingAppCount, setPendingAppCount] = useState(0);
  const [activeDeviceCount, setActiveDeviceCount] = useState(0);
  const [pendingRefundCount, setPendingRefundCount] = useState(0);

  // Payouts & Step-up PIN state (shared with FinancialPinModal & UserSecuritySettingsModal)
  const [payoutList, setPayoutList] = useState<PayoutRequest[]>([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutFilterStatus, setPayoutFilterStatus] = useState<string>('ALL');
  const [financialSessionActive, setFinancialSessionActive] = useState(false);
  const [financialRemaining, setFinancialRemaining] = useState(0);
  const [hasPin, setHasPin] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSecuritySettingsOpen, setIsSecuritySettingsOpen] = useState(false);

  const showSuccess = useCallback((msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  }, []);

  const loadPendingCourses = useCallback(async () => {
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      const page = await courseApi.getAdminCourses({ size: 100, status: 'PENDING' });
      setCoursesList(page.items);
    } catch (err: any) {
      setCoursesError(err?.message || 'Không tải được hàng chờ kiểm duyệt.');
      setCoursesList([]);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  const loadPayouts = useCallback(async (status?: string) => {
    setPayoutLoading(true);
    setPayoutError(null);
    try {
      const res = await payoutApi.getAdminPayouts({
        page: 0,
        size: 50,
        status: status && status !== 'ALL' ? status : undefined,
      });
      setPayoutList(res.items);
    } catch (err: any) {
      console.error('Lỗi tải danh sách rút tiền:', err);
      setPayoutError(err?.message || 'Không tải được danh sách yêu cầu rút tiền từ Finance Service.');
      setPayoutList([]);
    } finally {
      setPayoutLoading(false);
    }
  }, []);

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

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
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
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [financialSessionActive, financialRemaining]);

  const handleFinancialUnlocked = useCallback(() => {
    setFinancialSessionActive(true);
    setFinancialRemaining(15 * 60);
    void loadPayouts(payoutFilterStatus);
  }, [loadPayouts, payoutFilterStatus]);

  const handleLockFinancialSession = async () => {
    try {
      await securityApi.lockSession();
    } catch {
      // Ignore
    }
    setFinancialSessionActive(false);
    setFinancialRemaining(0);
  };

  useEffect(() => {
    void loadPendingCourses();
  }, [loadPendingCourses]);

  useEffect(() => {
    if (activeTab === 'payouts') {
      checkFinancialStatus().then(status => {
        if (status?.financialSessionActive) {
          void loadPayouts(payoutFilterStatus);
        } else {
          setIsPinModalOpen(true);
        }
      });
    }
  }, [activeTab, payoutFilterStatus, loadPayouts, checkFinancialStatus]);

  const pendingCoursesCount = coursesList.filter(c => c.status === 'PENDING').length;
  const pendingPayoutsCount = payoutList.filter(p => p.status === 'PENDING').length;

  const adminTabs = [
    { id: 'courses' as const, label: 'Kiểm Duyệt Khóa Học', icon: FileText, badge: pendingCoursesCount || undefined },
    { id: 'instructors' as const, label: 'Duyệt Giảng Viên', icon: Video, badge: pendingAppCount || undefined },
    { id: 'users' as const, label: 'Quản Lý Người Dùng', icon: Users },
    { id: 'certificates' as const, label: 'Thẩm Định Chứng Chỉ', icon: Award },
    { id: 'payouts' as const, label: 'Duyệt Rút Tiền', icon: DollarSign },
    { id: 'devices' as const, label: 'Giám Sát Thiết Bị (Redis)', icon: Smartphone },
    { id: 'refunds' as const, label: 'Khiếu Nại & Hoàn Tiền', icon: RotateCcw, badge: pendingRefundCount || undefined },
  ];

  return (
    <div className="space-y-6 pb-16">
      {onBackToLearner && (
        <button
          onClick={onBackToLearner}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại trang học viên
        </button>
      )}

      {/* Admin Space Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Không gian Quản trị viên
            </span>
            <span className="text-xs text-slate-400 font-mono">Phiên bảo mật: System Host</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1 text-white">
            Cổng Quản Trị & Vận Hành Hệ Thống
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Thẩm định nội dung khóa học, đối soát và xác thực chứng chỉ số trên toàn hệ thống, giám sát tài chính và phiên thiết bị đăng nhập.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadPendingCourses()}
            disabled={coursesLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${coursesLoading ? 'animate-spin' : ''}`} />
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {coursesError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{coursesError}</span>
        </div>
      )}

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs md:text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* 4-KPI Overview Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('courses')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Khóa chờ duyệt</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {pendingCoursesCount}
            </span>
            <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
              Cần xử lý
            </span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('instructors')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đơn giảng viên</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <Video className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {pendingAppCount}
            </span>
            <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
              Chờ duyệt
            </span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('payouts')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lệnh rút tiền</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {pendingPayoutsCount}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
              Chờ chi
            </span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('devices')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-sky-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Thiết bị Active</span>
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600 group-hover:scale-110 transition-transform">
              <Smartphone className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {activeDeviceCount}
            </span>
            <span className="text-[10px] text-sky-600 font-semibold bg-sky-50 px-1.5 py-0.5 rounded">
              Redis ZSet
            </span>
          </div>
        </div>
      </div>

      {/* Capsule Tab Switcher */}
      <div className="bg-slate-900/95 p-1.5 rounded-2xl shadow-md border border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
        {adminTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === t.id
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-white/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
            {t.badge !== undefined && t.badge > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black ml-1 animate-pulse">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'courses' && (
        <AdminCourseModerationTab
          coursesList={coursesList}
          coursesLoading={coursesLoading}
          coursesError={coursesError}
          onPreviewCourse={onPreviewCourse}
          onReloadCourses={loadPendingCourses}
          onSuccess={showSuccess}
          onError={setCoursesError}
        />
      )}

      {activeTab === 'instructors' && (
        <AdminInstructorAppsTab
          onSuccess={showSuccess}
          onPendingCountChange={setPendingAppCount}
        />
      )}

      {activeTab === 'users' && (
        <AdminUserManagementTab onSuccess={showSuccess} />
      )}

      {activeTab === 'certificates' && <AdminCertificatesTab />}

      {activeTab === 'payouts' && (
        <AdminPayoutsTab
          financialSessionActive={financialSessionActive}
          financialRemaining={financialRemaining}
          hasPin={hasPin}
          payoutList={payoutList}
          payoutLoading={payoutLoading}
          payoutError={payoutError}
          payoutFilterStatus={payoutFilterStatus}
          onChangeFilterStatus={setPayoutFilterStatus}
          onReloadPayouts={loadPayouts}
          onSetPayoutError={setPayoutError}
          onSuccess={showSuccess}
          onOpenPinModal={() => setIsPinModalOpen(true)}
          onOpenSecuritySettings={() => setIsSecuritySettingsOpen(true)}
          onLockSession={handleLockFinancialSession}
        />
      )}

      {activeTab === 'devices' && (
        <AdminDevicesTab
          onSuccess={showSuccess}
          onCountChange={setActiveDeviceCount}
        />
      )}

      {activeTab === 'refunds' && (
        <AdminRefundsTab
          onSuccess={showSuccess}
          onPendingCountChange={setPendingRefundCount}
        />
      )}

      <FinancialPinModal
        isOpen={isPinModalOpen}
        hasPin={hasPin}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handleFinancialUnlocked}
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
