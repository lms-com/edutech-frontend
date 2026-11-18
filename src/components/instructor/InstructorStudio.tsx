import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  Course,
  CourseSection,
  InstructorWalletBalance,
  PayoutRequest,
} from '../../types';
import courseApi from '../../api/courseApi';
import payoutApi from '../../api/payoutApi';
import { securityApi } from '../../api/securityApi';
import { FinancialPinModal } from '../security/FinancialPinModal';
import { UserSecuritySettingsModal } from '../security/UserSecuritySettingsModal';
import { LessonAttachmentsModal } from './LessonAttachmentsModal';
import { StudioCurriculumTab } from './studio/StudioCurriculumTab';
import { StudioSettingsTab } from './studio/StudioSettingsTab';
import { StudioAnalyticsTab } from './studio/StudioAnalyticsTab';
import { StudioUploadTab } from './studio/StudioUploadTab';
import { StudioPayoutsTab } from './studio/StudioPayoutsTab';
import { StudioPromotionsTab } from './studio/StudioPromotionsTab';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  Layers,
  Loader2,
  Send,
  Settings,
  Sparkles,
  Tag,
  UploadCloud,
  Wallet,
} from 'lucide-react';

const VideoHlsPreviewModal = React.lazy(() =>
  import('./studio/VideoHlsPreviewModal').then(m => ({ default: m.VideoHlsPreviewModal }))
);

interface InstructorStudioProps {
  course: Course;
  onEnterLearningRoom: (course: Course) => void;
  onBackToLearner?: () => void;
  onBackToCourseList?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  DRAFT: { label: 'Bản nháp', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  PENDING: { label: 'Chờ duyệt', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
  PUBLISHED: { label: 'Đã xuất bản', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  REJECTED: { label: 'Bị từ chối', badge: 'bg-rose-100 text-rose-900 border-rose-300' },
};

type StudioTabId = 'curriculum' | 'settings' | 'dashboard' | 'upload' | 'payouts' | 'promotions';

const STUDIO_TABS: { id: StudioTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'curriculum', label: 'Soạn giáo trình (Curriculum)', icon: Layers },
  { id: 'settings', label: 'Cài đặt khóa học', icon: Settings },
  { id: 'dashboard', label: 'Thống kê & Doanh thu KPI', icon: BarChart3 },
  { id: 'promotions', label: 'Mã giảm giá & Voucher', icon: Tag },
  { id: 'upload', label: 'Upload Video MinIO (HLS)', icon: UploadCloud },
  { id: 'payouts', label: 'Ví & Yêu cầu Rút tiền', icon: Wallet },
];

export const InstructorStudio: React.FC<InstructorStudioProps> = ({
  course: initialCourse,
  onEnterLearningRoom,
  onBackToLearner,
  onBackToCourseList,
}) => {
  const [currentCourse, setCurrentCourse] = useState<Course>(initialCourse);
  const [activeTab, setActiveTab] = useState<StudioTabId>('curriculum');
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [sections, setSections] = useState<CourseSection[]>(initialCourse.sections || []);
  const sectionInputRef = useRef<HTMLInputElement>(null);
  const [attachmentModalLesson, setAttachmentModalLesson] = useState<{ id: string; title: string } | null>(null);

  // Video Preview & Target Lesson State (shared between Curriculum & Upload tabs)
  const [selectedTargetLessonId, setSelectedTargetLessonId] = useState<string>('');
  const [selectedLessonTitle, setSelectedLessonTitle] = useState('Bài học');
  const [previewMediaId, setPreviewMediaId] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Payout & Financial Security State (shared with FinancialPinModal & UserSecuritySettingsModal)
  const [payoutList, setPayoutList] = useState<PayoutRequest[]>([]);
  const [walletBalance, setWalletBalance] = useState<InstructorWalletBalance | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [financialSessionActive, setFinancialSessionActive] = useState(false);
  const [financialRemaining, setFinancialRemaining] = useState(0);
  const [hasPin, setHasPin] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSecuritySettingsOpen, setIsSecuritySettingsOpen] = useState(false);

  const showSuccess = useCallback((msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
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

  const loadPayoutData = useCallback(async () => {
    setPayoutLoading(true);
    setPayoutError(null);
    try {
      const [balanceRes, payoutsRes] = await Promise.all([
        payoutApi.getMyBalance(),
        payoutApi.getMyPayoutRequests({ page: 0, size: 20 }),
      ]);
      setWalletBalance(balanceRes);
      setPayoutList(payoutsRes.items);
    } catch (err: any) {
      console.error('Lỗi nạp dữ liệu ví & rút tiền:', err);
      setPayoutError(err?.message || 'Không thể tải thông tin ví và lịch sử rút tiền.');
    } finally {
      setPayoutLoading(false);
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
    void loadPayoutData();
  }, [loadPayoutData]);

  const handleLockFinancialSession = async () => {
    try {
      await securityApi.lockSession();
    } catch {
      // Ignore
    }
    setFinancialSessionActive(false);
    setFinancialRemaining(0);
  };

  const loadCourseData = useCallback(async () => {
    setCurriculumLoading(true);
    setCurriculumError(null);
    try {
      const fullDetail = await courseApi.getCourseById(initialCourse.id);
      setCurrentCourse(fullDetail);
      setSections(fullDetail.sections || []);
    } catch (err: any) {
      setCurriculumError(err?.message || 'Không tải được chi tiết giáo trình.');
    } finally {
      setCurriculumLoading(false);
    }
  }, [initialCourse.id]);

  useEffect(() => {
    void loadCourseData();
  }, [loadCourseData]);

  useEffect(() => {
    if (activeTab === 'payouts') {
      checkFinancialStatus().then(status => {
        if (status?.financialSessionActive) {
          void loadPayoutData();
        } else {
          setIsPinModalOpen(true);
        }
      });
    }
  }, [activeTab, checkFinancialStatus, loadPayoutData]);

  const handleSubmitForReview = async () => {
    if (sections.length === 0) {
      setCurriculumError('Khóa học phải có ít nhất 1 chương học trước khi gửi duyệt. Bạn hãy nhập tên chương ở ô bên dưới.');
      sectionInputRef.current?.focus();
      return;
    }
    setActionLoading(true);
    setCurriculumError(null);
    try {
      await courseApi.changeCourseStatus(currentCourse.id, 'PENDING');
      showSuccess('Đã gửi khóa học lên ban quản trị xét duyệt thành công!');
      await loadCourseData();
    } catch (err: any) {
      setCurriculumError(err?.message || 'Không thể gửi duyệt khóa học.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreviewVideo = useCallback((mediaId: string, title: string) => {
    setPreviewMediaId(mediaId);
    setSelectedLessonTitle(title);
    setPreviewModalOpen(true);
  }, []);

  const handleUpdateLessonVideoLocal = useCallback((lessonId: string, mediaId: string, title?: string) => {
    setSections(prevSections =>
      prevSections.map(sec => ({
        ...sec,
        lessons: (sec.lessons || []).map(l =>
          l.id === lessonId ? { ...l, videoUrl: mediaId, title: title ?? l.title } : l
        ),
      }))
    );
  }, []);

  const statusUpper = (currentCourse.status || 'DRAFT').toUpperCase();
  const statusCfg = STATUS_CONFIG[statusUpper] || {
    label: currentCourse.status,
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Navigation bar */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
        {onBackToCourseList && (
          <button
            onClick={onBackToCourseList}
            className="inline-flex items-center gap-1.5 hover:text-[#2c3e50] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách khóa học
          </button>
        )}
        {onBackToLearner && (
          <button
            onClick={onBackToLearner}
            className="inline-flex items-center gap-1.5 hover:text-[#2c3e50] transition-colors cursor-pointer ml-auto"
          >
            ← Về trang học viên
          </button>
        )}
      </div>

      {/* Studio Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-800 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e74c3c] text-white text-[11px] font-bold uppercase tracking-wider">
                Instructor Studio
              </span>
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusCfg.badge}`}>
                {statusCfg.label}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Mã khóa: {currentCourse.id}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {currentCourse.title}
            </h1>
            <p className="text-xs text-slate-300">
              {currentCourse.shortDescription || 'Chưa có mô tả ngắn cho khóa học này.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(statusUpper === 'DRAFT' || statusUpper === 'REJECTED') && (
              <button
                disabled={actionLoading}
                onClick={handleSubmitForReview}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Gửi duyệt khóa học
              </button>
            )}

            {statusUpper === 'PENDING' && (
              <span className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Đang chờ duyệt
              </span>
            )}

            <button
              onClick={() => onEnterLearningRoom(currentCourse)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Xem trước học viên
            </button>
          </div>
        </div>

        {statusUpper === 'REJECTED' && currentCourse.rejectionNote && (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-950/40 p-4 text-xs text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div className="space-y-1">
              <p className="font-bold text-rose-300">Khóa học bị từ chối phê duyệt từ Ban quản trị</p>
              <p className="text-rose-100 leading-relaxed">{currentCourse.rejectionNote}</p>
              <p className="text-[11px] text-rose-300 pt-1">Vui lòng điều chỉnh lại giáo trình hoặc thông tin theo góp ý ở trên và bấm "Gửi duyệt khóa học" lại.</p>
            </div>
          </div>
        )}
      </div>

      {/* Global Alert / Feedback */}
      {actionSuccessMsg && (
        <div role="status" className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {curriculumError && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{curriculumError}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="bg-slate-900/95 p-1.5 rounded-2xl shadow-md border border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
        {STUDIO_TABS.map(t => (
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
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'curriculum' && (
        <StudioCurriculumTab
          courseId={currentCourse.id}
          sections={sections}
          curriculumLoading={curriculumLoading}
          curriculumError={curriculumError}
          sectionInputRef={sectionInputRef}
          onClearError={() => setCurriculumError(null)}
          onError={(msg) => setCurriculumError(msg)}
          onSuccess={showSuccess}
          onReloadCourse={loadCourseData}
          onSetLoading={setCurriculumLoading}
          onPreviewVideo={handlePreviewVideo}
          onUploadForLesson={(id, title) => {
            setSelectedTargetLessonId(id);
            setSelectedLessonTitle(title);
            setActiveTab('upload');
          }}
          onOpenAttachments={(id, title) => setAttachmentModalLesson({ id, title })}
        />
      )}

      {activeTab === 'settings' && (
        <StudioSettingsTab
          course={currentCourse}
          onCourseUpdated={(updated) => setCurrentCourse(prev => ({ ...prev, ...updated }))}
          onSuccess={showSuccess}
          onError={(msg) => setCurriculumError(msg)}
          onClearError={() => setCurriculumError(null)}
        />
      )}

      {activeTab === 'dashboard' && (
        <StudioAnalyticsTab onGoToPayouts={() => setActiveTab('payouts')} />
      )}

      {activeTab === 'upload' && (
        <StudioUploadTab
          sections={sections}
          selectedTargetLessonId={selectedTargetLessonId}
          selectedLessonTitle={selectedLessonTitle}
          onSelectTargetLesson={(id, title) => {
            setSelectedTargetLessonId(id);
            setSelectedLessonTitle(title);
          }}
          onChangeLessonTitle={setSelectedLessonTitle}
          onBackToCurriculum={() => setActiveTab('curriculum')}
          onUpdateLessonVideoLocal={handleUpdateLessonVideoLocal}
          onReloadCourse={loadCourseData}
          onSuccess={showSuccess}
          onPreviewVideo={handlePreviewVideo}
        />
      )}

      {activeTab === 'payouts' && (
        <StudioPayoutsTab
          financialSessionActive={financialSessionActive}
          financialRemaining={financialRemaining}
          hasPin={hasPin}
          walletBalance={walletBalance}
          payoutList={payoutList}
          payoutLoading={payoutLoading}
          payoutError={payoutError}
          onClearPayoutError={() => setPayoutError(null)}
          onSetPayoutError={setPayoutError}
          onOpenPinModal={() => setIsPinModalOpen(true)}
          onOpenSecuritySettings={() => setIsSecuritySettingsOpen(true)}
          onLockSession={handleLockFinancialSession}
          onReloadPayoutData={loadPayoutData}
        />
      )}

      {activeTab === 'promotions' && (
        <StudioPromotionsTab
          courseId={currentCourse.id}
          courseTitle={currentCourse.title}
          onSuccess={showSuccess}
        />
      )}

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

      <LessonAttachmentsModal
        isOpen={!!attachmentModalLesson}
        onClose={() => setAttachmentModalLesson(null)}
        lessonId={attachmentModalLesson?.id || ''}
        lessonTitle={attachmentModalLesson?.title || ''}
      />

      {previewModalOpen && (
        <Suspense fallback={null}>
          <VideoHlsPreviewModal
            isOpen={previewModalOpen}
            onClose={() => setPreviewModalOpen(false)}
            mediaId={previewMediaId || ''}
            lessonTitle={selectedLessonTitle}
          />
        </Suspense>
      )}
    </div>
  );
};
