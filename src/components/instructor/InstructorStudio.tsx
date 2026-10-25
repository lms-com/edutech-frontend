import Hls from 'hls.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  Course, 
  CourseSection, 
  PayoutRequest, 
  InstructorWalletBalance,
  InstructorAnalyticsOverview,
  RevenueChartPoint
} from '../../types';
import courseApi from '../../api/courseApi';
import mediaApi from '../../api/mediaApi';
import payoutApi from '../../api/payoutApi';
import instructorAnalyticsApi from '../../api/instructorAnalyticsApi';
import promotionApi, { type PromotionDto, type CreatePromotionPayload } from '../../api/promotionApi';
import { securityApi } from '../../api/securityApi';
import { FinancialPinModal } from '../security/FinancialPinModal';
import { UserSecuritySettingsModal } from '../security/UserSecuritySettingsModal';
import { LessonAttachmentsModal } from './LessonAttachmentsModal';
import { formatVND } from '../../utils/format';
import { 
  Users, 
  DollarSign, 
  Wallet, 
  Star, 
  Plus, 
  UploadCloud, 
  FileVideo, 
  FileText,
  CheckCircle2, 
  Clock, 
  Send, 
  Sparkles, 
  Layers, 
  CreditCard,
  AlertCircle,
  ArrowLeft,
  Trash2,
  Settings,
  HelpCircle,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Shield,
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BookOpen,
  Image as ImageIcon,
  Tag,
  Link2,
  Unlink,
  Play,
  X,
  Film,
} from 'lucide-react';

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


interface VideoHlsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: string;
  lessonTitle?: string;
}

const VideoHlsPreviewModal: React.FC<VideoHlsPreviewModalProps> = ({ isOpen, onClose, mediaId, lessonTitle }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !mediaId) return;
    setError(null);
    setLoading(true);

    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Direct HLS view endpoint on media-service via gateway
    const isHttp = mediaId.startsWith('http://') || mediaId.startsWith('https://');
    const isM3u8 = mediaId.includes('.m3u8') || mediaId.includes('/view');
    const isDirectMp4 = isHttp && !isM3u8;

    if (isDirectMp4) {
      // Trường hợp video là link MP4 trực tiếp ngoài (như seed data Google Cloud)
      video.src = mediaId;
      video.onloadeddata = () => {
        setLoading(false);
        video.play().catch(e => console.log('Autoplay muted:', e));
      };
      video.onerror = () => {
        setError('Không thể phát video từ đường dẫn trực tiếp: ' + mediaId);
        setLoading(false);
      };
      return;
    }

    // Direct HLS view endpoint on media-service via gateway or external m3u8
    const streamUrl = isHttp ? mediaId : `/media-service/api/v1/media/${mediaId}/view`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        xhrSetup: (xhr, url) => {
          // Không gửi Authorization / Fingerprint header tới MinIO port 9000
          if (!url.includes(':9000') && !url.includes('.s3.')) {
            const token = localStorage.getItem('access_token');
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            const fp = sessionStorage.getItem('device_fingerprint');
            if (fp) xhr.setRequestHeader('X-Device-Fingerprint', fp);
          }
        },
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(e => console.log('Autoplay muted / pending user click:', e));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error('Lỗi khi tải stream HLS:', data);
          setError('Không thể kết nối hoặc giải mã luồng HLS AES-128. Vui lòng đảm bảo worker đã xử lý xong.');
          setLoading(false);
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      setLoading(false);
    } else {
      setError('Trình duyệt của bạn không hỗ trợ phát luồng HLS.');
      setLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isOpen, mediaId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold flex items-center gap-2">
                Xem thử Video HLS
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                  AES-128
                </span>
              </h4>
              <p className="text-slate-400 text-xs truncate max-w-md">
                {lessonTitle ? `Bài học: ${lessonTitle}` : `Media ID: ${mediaId}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-950/60 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-xs">Đang nạp luồng video HLS mã hóa...</span>
            </div>
          )}
          {error ? (
            <div className="p-6 text-center text-rose-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto" />
              <p className="text-xs font-semibold">{error}</p>
              <p className="text-[11px] text-slate-400">Vui lòng đảm bảo worker đã hoàn tất mã hóa và lưu trữ trên MinIO.</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn phát: HLS (.m3u8)
            </span>
            <span>•</span>
            <span>Bảo mật: Mã hóa khóa AES-128 động</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export const InstructorStudio: React.FC<InstructorStudioProps> = ({
  course: initialCourse,
  onEnterLearningRoom,
  onBackToLearner,
  onBackToCourseList,
}) => {
  const [currentCourse, setCurrentCourse] = useState<Course>(initialCourse);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'settings' | 'dashboard' | 'upload' | 'payouts' | 'promotions'>('curriculum');
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Promotions Management State
  const [promotionsList, setPromotionsList] = useState<PromotionDto[]>([]);
  const [promotionsLoading, setPromotionsLoading] = useState(false);
  const [promotionsError, setPromotionsError] = useState<string | null>(null);
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);
  const [promoFormCode, setPromoFormCode] = useState('');
  const [promoDiscountType, setPromoDiscountType] = useState<'PERCENT' | 'AMOUNT'>('PERCENT');
  const [promoDiscountValue, setPromoDiscountValue] = useState('20');
  const [promoUsageLimit, setPromoUsageLimit] = useState('');
  const [promoEndDate, setPromoEndDate] = useState('');
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [promoActionLoadingId, setPromoActionLoadingId] = useState<string | null>(null);

  // Curriculum State
  const [sections, setSections] = useState<CourseSection[]>(initialCourse.sections || []);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [addingSection, setAddingSection] = useState(false);
  const sectionInputRef = useRef<HTMLInputElement>(null);

  // Add Lesson Form State per Section
  const [activeAddingLessonSectionId, setActiveAddingLessonSectionId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<'VIDEO' | 'QUIZ'>('VIDEO');
  const [lessonDurationMinutes, setLessonDurationMinutes] = useState(15);
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [addingLesson, setAddingLesson] = useState(false);
  const [attachmentModalLesson, setAttachmentModalLesson] = useState<{ id: string; title: string } | null>(null);

  // Course Settings Form State
  const [editTitle, setEditTitle] = useState(initialCourse.title);
  const [editDescription, setEditDescription] = useState(initialCourse.shortDescription);
  const [editPrice, setEditPrice] = useState(String(initialCourse.price));
  const [editLevel, setEditLevel] = useState(initialCourse.level || 'Cơ bản');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState(initialCourse.thumbnail || '');
  const [savingSettings, setSavingSettings] = useState(false);

  // Video Upload & HLS Pipeline State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'IDLE' | 'GETTING_PRESIGNED' | 'UPLOADING' | 'FFMPEG_PROCESSING' | 'COMPLETED' | 'ERROR'>('IDLE');
  const [selectedTargetLessonId, setSelectedTargetLessonId] = useState<string>('');
  const [selectedLessonTitle, setSelectedLessonTitle] = useState('Bài học');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastUploadedMediaId, setLastUploadedMediaId] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [assigningLessonId, setAssigningLessonId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Payout & Wallet State
  const [payoutAmount, setPayoutAmount] = useState('500000');
  const [payoutList, setPayoutList] = useState<PayoutRequest[]>([]);
  const [walletBalance, setWalletBalance] = useState<InstructorWalletBalance | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  // Analytics & KPI State
  const [analyticsOverview, setAnalyticsOverview] = useState<InstructorAnalyticsOverview | null>(null);
  const [revenueChartData, setRevenueChartData] = useState<RevenueChartPoint[]>([]);
  const [courseBreakdown, setCourseBreakdown] = useState<import('../../types').CourseRevenueBreakdown[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const loadAnalyticsData = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const [overview, chart, breakdown] = await Promise.all([
        instructorAnalyticsApi.getOverview(),
        instructorAnalyticsApi.getRevenueChart(),
        instructorAnalyticsApi.getCourseBreakdown(),
      ]);
      setAnalyticsOverview(overview);
      setRevenueChartData(chart);
      setCourseBreakdown(breakdown);
    } catch (err: any) {
      console.error('Lỗi nạp dữ liệu thống kê giảng viên:', err);
      setAnalyticsError(err?.message || 'Không thể tải số liệu phân tích doanh thu.');
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // Financial Security & Step-up PIN State
  const [financialSessionActive, setFinancialSessionActive] = useState(false);
  const [financialRemaining, setFinancialRemaining] = useState(0);
  const [hasPin, setHasPin] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSecuritySettingsOpen, setIsSecuritySettingsOpen] = useState(false);

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

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const loadCourseData = useCallback(async () => {
    setCurriculumLoading(true);
    setCurriculumError(null);
    try {
      const fullDetail = await courseApi.getCourseById(initialCourse.id);
      setCurrentCourse(fullDetail);
      setSections(fullDetail.sections || []);
      setEditTitle(fullDetail.title);
      setEditDescription(fullDetail.shortDescription);
      setEditPrice(String(fullDetail.price));
      setEditLevel(fullDetail.level || 'Cơ bản');
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
    if (activeTab === 'dashboard') {
      void loadAnalyticsData();
    }
    if (activeTab === 'promotions') {
      void loadPromotions();
    }
  }, [activeTab, checkFinancialStatus, loadPayoutData, loadAnalyticsData]);

  const loadPromotions = useCallback(async () => {
    setPromotionsLoading(true);
    setPromotionsError(null);
    try {
      const page = await promotionApi.getMyPromotions({ page: 0, size: 50 });
      setPromotionsList(page.items);
    } catch (err: any) {
      console.error('Lỗi tải mã giảm giá:', err);
      setPromotionsError(err?.message || 'Không thể tải danh sách mã giảm giá.');
    } finally {
      setPromotionsLoading(false);
    }
  }, []);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoFormCode.trim()) {
      setPromotionsError('Vui lòng nhập mã giảm giá.');
      return;
    }
    setPromoSubmitting(true);
    setPromotionsError(null);
    try {
      const payload: CreatePromotionPayload = {
        code: promoFormCode.trim().toUpperCase(),
        discountPercent: promoDiscountType === 'PERCENT' ? Number(promoDiscountValue) : null,
        discountAmount: promoDiscountType === 'AMOUNT' ? Number(promoDiscountValue) : null,
        usageLimit: promoUsageLimit ? Number(promoUsageLimit) : null,
        endDate: promoEndDate ? `${promoEndDate}T23:59:59` : null,
      };
      const newPromo = await promotionApi.createPromotion(payload);
      // Tự động gắn vào khóa học hiện tại
      await promotionApi.attachToCourse(newPromo.id, currentCourse.id);
      showSuccess(`Đã tạo mã giảm giá [${newPromo.code}] và áp dụng cho khóa học thành công!`);
      setIsCreatingPromo(false);
      setPromoFormCode('');
      setPromoDiscountValue('20');
      setPromoUsageLimit('');
      setPromoEndDate('');
      void loadPromotions();
    } catch (err: any) {
      setPromotionsError(err?.message || 'Không thể tạo mã giảm giá.');
    } finally {
      setPromoSubmitting(false);
    }
  };

  const handleToggleCourseAttach = async (promo: PromotionDto) => {
    const isAttached = (promo.appliedCourseIds || []).includes(currentCourse.id);
    setPromoActionLoadingId(promo.id);
    try {
      if (isAttached) {
        await promotionApi.detachFromCourse(promo.id, currentCourse.id);
        showSuccess(`Đã gỡ mã [${promo.code}] khỏi khóa học này.`);
      } else {
        await promotionApi.attachToCourse(promo.id, currentCourse.id);
        showSuccess(`Đã kích hoạt mã [${promo.code}] cho khóa học này!`);
      }
      void loadPromotions();
    } catch (err: any) {
      setPromotionsError(err?.message || 'Thao tác liên kết mã thất bại.');
    } finally {
      setPromoActionLoadingId(null);
    }
  };

  const handleDeletePromo = async (promoId: string, code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa mã giảm giá [${code}]?`)) return;
    setPromoActionLoadingId(promoId);
    try {
      await promotionApi.deletePromotion(promoId);
      showSuccess(`Đã xóa mã giảm giá [${code}].`);
      void loadPromotions();
    } catch (err: any) {
      setPromotionsError(err?.message || 'Không thể xóa mã giảm giá.');
    } finally {
      setPromoActionLoadingId(null);
    }
  };

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Submit Course for Review (DRAFT/REJECTED -> PENDING)
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

  // Save Settings / Metadata
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setSavingSettings(true);
    setCurriculumError(null);
    try {
      const levelMap: Record<string, string> = {
        'Cơ bản': 'BEGINNER',
        'Trung cấp': 'INTERMEDIATE',
        'Nâng cao': 'ADVANCED',
        'BEGINNER': 'BEGINNER',
        'INTERMEDIATE': 'INTERMEDIATE',
        'ADVANCED': 'ADVANCED'
      };
      const updated = await courseApi.updateCourse(currentCourse.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        thumbnailUrl: editThumbnailUrl.trim() || undefined,
        basePrice: Math.max(0, Number(editPrice) || 0),
        level: levelMap[editLevel] || 'BEGINNER',
      });
      setCurrentCourse(prev => ({ 
        ...prev, 
        ...updated,
        thumbnail: editThumbnailUrl.trim() || prev.thumbnail 
      }));
      showSuccess('Cập nhật thông tin và hình ảnh khóa học thành công!');
    } catch (err: any) {
      setCurriculumError(err?.message || 'Không thể cập nhật khóa học.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Add Section via Real API
  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) {
      setCurriculumError('Vui lòng nhập tên chương học trước khi bấm Thêm chương.');
      sectionInputRef.current?.focus();
      return;
    }
    setAddingSection(true);
    setCurriculumError(null);
    try {
      await courseApi.createSection({
        courseId: currentCourse.id,
        title: newSectionTitle.trim(),
        orderIndex: sections.length + 1,
      });
      setNewSectionTitle('');
      showSuccess('Đã thêm chương học mới thành công!');
      await loadCourseData();
    } catch (err: any) {
      setCurriculumError(err?.message || 'Không thể tạo chương học.');
    } finally {
      setAddingSection(false);
    }
  };

  // Delete Section via Real API
  const handleDeleteSection = async (sectionId: string, sectionTitle: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chương "${sectionTitle}" và toàn bộ bài học bên trong?`)) return;
    setCurriculumLoading(true);
    setCurriculumError(null);
    try {
      await courseApi.deleteSection(sectionId);
      showSuccess(`Đã xóa chương "${sectionTitle}".`);
      await loadCourseData();
    } catch (err: any) {
      setCurriculumError(err?.message || 'Không thể xóa chương học.');
    } finally {
      setCurriculumLoading(false);
    }
  };

  // Add Lesson via Real API
  const handleAddLesson = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;
    setAddingLesson(true);
    setCurriculumError(null);
    try {
      await courseApi.createLesson(sectionId, {
        title: lessonTitle.trim(),
        type: lessonType,
        duration: Math.max(60, lessonDurationMinutes * 60),
        videoUrl: lessonVideoUrl.trim() || undefined,
        freePreview: false,
      });
      setLessonTitle('');
      setLessonVideoUrl('');
      setActiveAddingLessonSectionId(null);
      showSuccess('Đã thêm bài học mới thành công!');
      await loadCourseData();
    } catch (err: any) {
      setCurriculumError(err?.message || 'Không thể tạo bài học.');
    } finally {
      setAddingLesson(false);
    }
  };

  // Delete Lesson via Real API
  const handleDeleteLesson = async (lessonId: string, lessonTitleToDelete: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bài học "${lessonTitleToDelete}"?`)) return;
    setCurriculumLoading(true);
    setCurriculumError(null);
    try {
      await courseApi.deleteLesson(lessonId);
      showSuccess(`Đã xóa bài học "${lessonTitleToDelete}".`);
      await loadCourseData();
    } catch (err: any) {
      setCurriculumError(err?.message || 'Không thể xóa bài học.');
    } finally {
      setCurriculumLoading(false);
    }
  };

  // Handle Assigning Existing Media to a Lesson
  const handleAssignVideoToLesson = async (lessonId: string, mediaId: string) => {
    if (!lessonId || !mediaId) return;
    setIsAssigning(true);
    try {
      await courseApi.updateLessonContent(lessonId, { videoUrl: mediaId });
      setSections(prevSections =>
        prevSections.map(sec => ({
          ...sec,
          lessons: (sec.lessons || []).map(l =>
            l.id === lessonId ? { ...l, videoUrl: mediaId } : l
          ),
        }))
      );
      showSuccess('Đã gán video vào bài học thành công!');
      await loadCourseData();
    } catch (err: any) {
      console.error('Lỗi khi gán video:', err);
      setUploadError('Không thể gán video vào bài học: ' + (err?.message || 'Lỗi server'));
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle Real Video Upload & HLS AES-128 Pipeline
  const handleRealUpload = async () => {
    if (!selectedVideoFile) {
      setUploadError('Vui lòng chọn một file video (.mp4, .mov, .mkv, v.v.) từ thiết bị.');
      return;
    }

    setUploadError(null);
    setUploadProgress(0);
    setUploadStatus('GETTING_PRESIGNED');

    try {
      // 1. Xin cấp Presigned Upload URL từ media-service
      const presigned = await mediaApi.getPresignedUploadUrl(
        selectedVideoFile.name,
        selectedVideoFile.type || 'video/mp4',
        selectedVideoFile.size
      );

      const mediaId = presigned.mediaId;
      setLastUploadedMediaId(mediaId);

      // 2. Upload file trực tiếp lên MinIO Storage qua presigned URL
      setUploadStatus('UPLOADING');
      await mediaApi.uploadDirectToMinIO(presigned.uploadUrl, selectedVideoFile, (pct) => {
        setUploadProgress(pct);
      });

      // 3. Xác nhận upload xong để media-service bắn message sang RabbitMQ cho Video-Worker
      setUploadStatus('FFMPEG_PROCESSING');
      setUploadProgress(100);
      await mediaApi.confirmUpload(mediaId);

      // 4. Polling kiểm tra tiến trình worker xử lý FFmpeg & bẻ HLS AES-128
      let attempts = 0;
      const maxAttempts = 60; // tối đa 2.5 phút
      const pollTimer = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await mediaApi.getMediaStatus(mediaId);
          if (statusRes.status === 'COMPLETED') {
            clearInterval(pollTimer);
            setUploadStatus('COMPLETED');

            // 5. Nếu giảng viên chọn bài học, tự động cập nhật bài học với videoUrl = mediaId
            if (selectedTargetLessonId) {
              try {
                await courseApi.updateLessonContent(selectedTargetLessonId, {
                  videoUrl: mediaId,
                  title: selectedLessonTitle || undefined,
                });
                // Cập nhật ngay lập tức vào state sections để hiển thị badge 'Có video' lập tức
                setSections(prevSections =>
                  prevSections.map(sec => ({
                    ...sec,
                    lessons: (sec.lessons || []).map(l =>
                      l.id === selectedTargetLessonId ? { ...l, videoUrl: mediaId, title: selectedLessonTitle || l.title } : l
                    ),
                  }))
                );
                showSuccess('Đã tải video lên MinIO, mã hóa HLS và gán vào bài học thành công!');
                await loadCourseData();
              } catch (linkErr: any) {
                console.error('Lỗi khi cập nhật bài học với video mới:', linkErr);
                setUploadError('Video đã mã hóa HLS trên MinIO nhưng chưa thể cập nhật bài học: ' + (linkErr?.message || 'Lỗi server'));
              }
            } else {
              showSuccess('Video đã tải lên và mã hóa HLS thành công trên MinIO! Vui lòng chọn bài học để gán video.');
            }
          } else if (statusRes.status === 'FAILED') {
            clearInterval(pollTimer);
            setUploadStatus('ERROR');
            setUploadError('Worker FFmpeg gặp lỗi khi bẻ chunk hoặc mã hóa video.');
          } else if (attempts >= maxAttempts) {
            clearInterval(pollTimer);
            setUploadStatus('ERROR');
            setUploadError('Thời gian xử lý video quá lâu. Vui lòng kiểm tra lại sau.');
          }
        } catch (pollErr: any) {
          console.warn('Đang chờ worker hoàn tất...', pollErr);
        }
      }, 2500);

    } catch (err: any) {
      console.error('Lỗi khi tải video lên:', err);
      setUploadStatus('ERROR');
      setUploadError(err.message || 'Đã xảy ra lỗi khi tải video lên MinIO.');
    }
  };

  const handleCreatePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(payoutAmount);
    if (isNaN(amountNum) || amountNum < 500000) {
      setPayoutError('Số tiền rút tối thiểu là 500.000 VNĐ theo quy định của hệ thống.');
      return;
    }
    if (walletBalance && walletBalance.availableBalance > 0 && amountNum > walletBalance.availableBalance) {
      setPayoutError(`Số dư khả dụng hiện tại (${formatVND(walletBalance.availableBalance)}) không đủ để tạo yêu cầu rút này.`);
      return;
    }

    setPayoutSubmitting(true);
    setPayoutError(null);
    setPayoutSuccessMsg('');

    try {
      await payoutApi.createPayoutRequest(amountNum);
      setPayoutSuccessMsg(`Đã gửi yêu cầu rút ${formatVND(amountNum)} thành công. Số tiền đã được tạm khóa và đang chờ Quản trị viên duyệt.`);
      await loadPayoutData();
      setTimeout(() => setPayoutSuccessMsg(''), 6000);
    } catch (err: any) {
      console.error('Lỗi tạo lệnh rút tiền:', err);
      setPayoutError(err?.message || 'Không thể tạo yêu cầu rút tiền. Vui lòng kiểm tra tài khoản ngân hàng và số dư ví.');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const statusUpper = (currentCourse.status || 'DRAFT').toUpperCase();
  const statusCfg = STATUS_CONFIG[statusUpper] || { label: currentCourse.status, badge: 'bg-slate-100 text-slate-700 border-slate-200' };

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
      <div className="bg-[#1e293b] text-white p-6 md:p-8 rounded-3xl shadow-lg space-y-4">
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
            {/* Submit for review button */}
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

        {/* Rejection Note Warning if REJECTED */}
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
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
        {[
          { id: 'curriculum', label: 'Soạn giáo trình (Curriculum)', icon: Layers },
          { id: 'settings', label: 'Cài đặt khóa học', icon: Settings },
          { id: 'dashboard', label: 'Thống kê & Doanh thu KPI', icon: BarChart3 },
          { id: 'promotions', label: 'Mã giảm giá & Voucher', icon: Tag },
          { id: 'upload', label: 'Upload Video MinIO (HLS)', icon: UploadCloud },
          { id: 'payouts', label: 'Ví & Yêu cầu Rút tiền', icon: Wallet }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === t.id
                ? 'bg-[#2c3e50] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: CURRICULUM BUILDER (REAL API) */}
      {activeTab === 'curriculum' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-[#2c3e50]">Quản lý Chương & Bài giảng</h3>
              <p className="text-xs text-slate-500">Mọi thay đổi được lưu trực tiếp vào cơ sở dữ liệu của hệ thống qua Course Service.</p>
            </div>

            {/* Add Section Form in Header */}
            <form onSubmit={handleAddSection} className="flex items-center gap-2">
              <input
                ref={sectionInputRef}
                type="text"
                value={newSectionTitle}
                onChange={e => {
                  setNewSectionTitle(e.target.value);
                  if (curriculumError) setCurriculumError(null);
                }}
                placeholder="Nhập tiêu đề chương mới..."
                className="px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 shadow-xs w-56 sm:w-72"
              />
              <button
                disabled={addingSection}
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {addingSection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Thêm chương
              </button>
            </form>
          </div>

          {curriculumLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang đồng bộ giáo trình từ máy chủ...
            </div>
          ) : sections.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center shadow-xs">
                <Layers className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-slate-800">Khóa học chưa có chương học nào</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Để gửi duyệt khóa học, bạn cần thêm ít nhất 1 chương học và bài giảng. Nhập tên chương bên dưới và bấm nút:
                </p>
              </div>

              <form onSubmit={handleAddSection} className="flex flex-col sm:flex-row items-center gap-2 pt-2 max-w-md mx-auto">
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={e => {
                    setNewSectionTitle(e.target.value);
                    if (curriculumError) setCurriculumError(null);
                  }}
                  placeholder="Ví dụ: Chương 1: Giới thiệu tổng quan"
                  className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 shadow-xs"
                />
                <button
                  disabled={addingSection}
                  type="submit"
                  className="w-full sm:w-auto whitespace-nowrap px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {addingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Tạo chương đầu tiên
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, idx) => (
                <div key={section.id} className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-[#2c3e50] text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-sm text-[#2c3e50]">{section.title}</h4>
                      <span className="text-xs text-slate-400 font-mono">({section.lessons.length} bài học)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteSection(section.id, section.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Xóa chương này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Lessons list inside section */}
                  <div className="space-y-2 pl-4 sm:pl-8">
                    {section.lessons.map(lesson => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <FileVideo className="w-4 h-4 text-[#e74c3c]" />
                          <span className="font-semibold text-slate-700">{lesson.title}</span>
                          {lesson.videoUrl && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Có video
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-[11px]">{lesson.durationMinutes} phút</span>
                          {lesson.videoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setLastUploadedMediaId(lesson.videoUrl || '');
                                setSelectedLessonTitle(lesson.title);
                                setPreviewModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-200 cursor-pointer"
                              title="Xem thử video của bài học này"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Xem</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTargetLessonId(lesson.id);
                              setSelectedLessonTitle(lesson.title);
                              setActiveTab('upload');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition border border-indigo-200 cursor-pointer"
                            title="Tải video lên cho bài học này"
                          >
                            <UploadCloud className="w-3 h-3" />
                            <span>{lesson.videoUrl ? 'Đổi video' : 'Tải video'}</span>
                          </button>
                          <button
                            onClick={() => setAttachmentModalLesson({ id: lesson.id, title: lesson.title })}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-[#e74c3c] bg-slate-100 hover:bg-rose-50 rounded-lg transition border border-slate-200 hover:border-rose-200 cursor-pointer"
                            title="Quản lý tài liệu đính kèm"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Tài liệu</span>
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                            title="Xóa bài học"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Quiz inside section if any */}
                    {section.quiz && (
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 shadow-xs">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-amber-600" />
                          <span className="font-bold">{section.quiz.title}</span>
                        </div>
                        <span className="font-semibold text-amber-700">{section.quiz.questions?.length || 0} câu hỏi</span>
                      </div>
                    )}

                    {/* Add Lesson Form per Section */}
                    {activeAddingLessonSectionId === section.id ? (
                      <form onSubmit={e => handleAddLesson(e, section.id)} className="p-4 bg-white rounded-xl border border-indigo-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-900">Thêm bài học vào Chương {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => setActiveAddingLessonSectionId(null)}
                            className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Đóng
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-[11px] font-semibold text-slate-700 space-y-1 sm:col-span-2">
                            Tiêu đề bài học
                            <input
                              required
                              type="text"
                              value={lessonTitle}
                              onChange={e => setLessonTitle(e.target.value)}
                              placeholder="Ví dụ: Giới thiệu cấu trúc dự án"
                              className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </label>
                          <label className="text-[11px] font-semibold text-slate-700 space-y-1">
                            Loại bài học
                            <select
                              value={lessonType}
                              onChange={e => setLessonType(e.target.value as any)}
                              className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
                            >
                              <option value="VIDEO">Video bài giảng</option>
                              <option value="QUIZ">Trắc nghiệm Quiz</option>
                            </select>
                          </label>
                          <label className="text-[11px] font-semibold text-slate-700 space-y-1">
                            Thời lượng ước tính (phút)
                            <input
                              type="number"
                              min="1"
                              value={lessonDurationMinutes}
                              onChange={e => setLessonDurationMinutes(Number(e.target.value) || 1)}
                              className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </label>
                          <label className="text-[11px] font-semibold text-slate-700 space-y-1 sm:col-span-2">
                            URL Video (HLS/MP4 hoặc MinIO link)
                            <input
                              type="text"
                              value={lessonVideoUrl}
                              onChange={e => setLessonVideoUrl(e.target.value)}
                              placeholder="https://example.com/videos/lesson1.m3u8 (hoặc để trống tải sau)"
                              className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </label>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            disabled={addingLesson || !lessonTitle.trim()}
                            type="submit"
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {addingLesson && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Lưu bài học
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveAddingLessonSectionId(null)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-lg cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveAddingLessonSectionId(section.id);
                          setLessonTitle('');
                          setLessonVideoUrl('');
                        }}
                        className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm bài giảng vào chương này
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COURSE SETTINGS (REAL API) */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-2xl">
          <div>
            <h3 className="font-bold text-base text-[#2c3e50]">Thông tin chung khóa học</h3>
            <p className="text-xs text-slate-500">Chỉnh sửa tiêu đề, mô tả và giá bán khóa học. Cập nhật được ghi thẳng vào database.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <label className="block text-xs font-bold text-slate-700 space-y-1">
              Tiêu đề khóa học
              <input
                required
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#2c3e50]"
              />
            </label>

            <label className="block text-xs font-bold text-slate-700 space-y-1">
              Mô tả chi tiết
              <textarea
                rows={4}
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#2c3e50]"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-xs font-bold text-slate-700 space-y-1">
                Giá bán (VND)
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={editPrice}
                  onChange={e => setEditPrice(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#2c3e50]"
                />
              </label>

              <label className="block text-xs font-bold text-slate-700 space-y-1">
                Trình độ
                <select
                  value={editLevel}
                  onChange={e => setEditLevel(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-[#2c3e50]"
                >
                  <option value="Cơ bản">Cơ bản</option>
                  <option value="Trung cấp">Trung cấp</option>
                  <option value="Nâng cao">Nâng cao</option>
                </select>
              </label>
            </div>

            {/* Chỉnh sửa Ảnh bìa khóa học */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700">
                Hình ảnh đại diện khóa học (Thumbnail URL)
              </label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={editThumbnailUrl}
                  onChange={e => setEditThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... hoặc dán link ảnh trực tiếp"
                  className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#2c3e50]"
                />
              </div>

              {/* Preview Thumbnail */}
              {editThumbnailUrl.trim() && (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 aspect-video max-h-44 bg-slate-100 flex items-center justify-center">
                  <img
                    src={editThumbnailUrl}
                    alt="Xem trước ảnh bìa"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';
                    }}
                  />
                  <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                    Ảnh bìa đang hiển thị
                  </span>
                </div>
              )}
              <p className="text-[10px] text-slate-400">
                Hình ảnh hiển thị với học viên tại trang danh mục và trang chi tiết khóa học.
              </p>
            </div>

            <button
              disabled={savingSettings || !editTitle.trim()}
              type="submit"
              className="px-5 py-2.5 bg-[#2c3e50] hover:bg-[#1a252f] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {savingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu thay đổi
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: LIVE KPI DASHBOARD & REVENUE ANALYTICS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-[#2c3e50] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Trung Tâm Phân Tích & Thống Kê Doanh Thu Giảng Viên
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dữ liệu tài chính, lượt học viên đăng ký và dòng tiền thực tế được đồng bộ trực tiếp từ Finance & Course Service.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadAnalyticsData()}
                disabled={analyticsLoading}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                title="Làm mới số liệu"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>
          </div>

          {analyticsError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{analyticsError}</span>
            </div>
          )}

          {analyticsLoading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Đang tổng hợp số liệu doanh thu và học viên từ máy chủ...</span>
            </div>
          ) : (
            <>
              {/* 4 KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Students */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Tổng học viên đã đăng ký</span>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-[#2c3e50]">
                    {(analyticsOverview?.totalStudents ?? 0).toLocaleString()}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <span className="text-blue-600 font-bold">
                      +{analyticsOverview?.thisMonthSales ?? 0}
                    </span>
                    <span>lượt mua trong tháng này</span>
                  </div>
                </div>

                {/* This Month Revenue */}
                <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-2 relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/20">
                  <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
                    <span>Doanh thu tháng này</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-emerald-700">
                    {formatVND(analyticsOverview?.thisMonthRevenue ?? 0)}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded ${
                      (analyticsOverview?.growthRate ?? 0) >= 0 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {(analyticsOverview?.growthRate ?? 0) >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-emerald-700" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-rose-700" />
                      )}
                      {(analyticsOverview?.growthRate ?? 0) >= 0 ? '+' : ''}
                      {analyticsOverview?.growthRate ?? 0}%
                    </span>
                    <span className="text-slate-400">so với tháng trước</span>
                  </div>
                </div>

                {/* Available Balance */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Số dư ví khả dụng</span>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-[#e74c3c]">
                    {formatVND(analyticsOverview?.availableBalance ?? 0)}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Tạm khóa: {formatVND(analyticsOverview?.pendingBalance ?? 0)}</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('payouts')}
                      className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer"
                    >
                      Rút tiền →
                    </button>
                  </div>
                </div>

                {/* Total Courses & All Time Revenue */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Tổng khóa học & Doanh thu</span>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-[#2c3e50]">
                    {analyticsOverview?.totalCourses ?? 0} khóa học
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Trọn đời: <strong className="text-slate-700 font-bold">{formatVND(analyticsOverview?.allTimeRevenue ?? 0)}</strong>
                  </div>
                </div>
              </div>

              {/* REVENUE TREND CHART (6 MONTHS) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Biểu Đồ Xu Hướng Doanh Thu (6 Tháng Gần Nhất)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Theo dõi số tiền thực nhận (hoa hồng sau khi trừ phí sàn) và tổng số lượt bán khóa học theo từng tháng.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
                      Doanh thu thực nhận
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-3 h-3 rounded-sm bg-indigo-200 inline-block"></span>
                      Tổng doanh số gộp
                    </span>
                  </div>
                </div>

                {/* Visual Chart Bars */}
                {revenueChartData.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    Chưa có dữ liệu giao dịch phát sinh trong 6 tháng gần nhất.
                  </div>
                ) : (
                  <div className="space-y-6 pt-2">
                    <div className="grid grid-cols-6 gap-2 sm:gap-4 h-56 items-end pb-2 border-b border-slate-200">
                      {(() => {
                        const maxVal = Math.max(
                          ...revenueChartData.map(d => Math.max(d.grossSales, d.revenue)),
                          1000000
                        );
                        return revenueChartData.map((pt, idx) => {
                          const revPct = Math.min(100, Math.max(6, Math.round((pt.revenue / maxVal) * 100)));
                          const grossPct = Math.min(100, Math.max(8, Math.round((pt.grossSales / maxVal) * 100)));

                          return (
                            <div key={pt.period || idx} className="flex flex-col items-center h-full justify-end group relative">
                              {/* Hover Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-16 z-20 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl pointer-events-none whitespace-nowrap space-y-0.5">
                                <p className="font-bold text-amber-300">{pt.label}</p>
                                <p>Thực nhận: <strong>{formatVND(pt.revenue)}</strong></p>
                                <p className="text-slate-300">Doanh số: {formatVND(pt.grossSales)} ({pt.orderCount} đơn)</p>
                              </div>

                              <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full pb-1">
                                {/* Gross Sales Bar */}
                                <div
                                  style={{ height: `${grossPct}%` }}
                                  className="w-3 sm:w-5 bg-indigo-100 group-hover:bg-indigo-200 rounded-t-md transition-all duration-500"
                                  title={`Doanh số gộp: ${formatVND(pt.grossSales)}`}
                                />
                                {/* Net Revenue Bar */}
                                <div
                                  style={{ height: `${revPct}%` }}
                                  className="w-4 sm:w-7 bg-emerald-600 group-hover:bg-emerald-500 rounded-t-md transition-all duration-500 shadow-xs relative"
                                  title={`Thực nhận: ${formatVND(pt.revenue)}`}
                                >
                                  {pt.revenue > 0 && (
                                    <div className="hidden sm:block absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-800">
                                      {pt.orderCount > 0 ? `${pt.orderCount}đ` : ''}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <span className="text-[11px] font-bold text-slate-700 mt-2 block">
                                {pt.label}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Detailed Data Table for 6 Months */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs min-w-[500px]">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Kỳ báo cáo</th>
                            <th className="p-3">Doanh thu thực nhận</th>
                            <th className="p-3">Tổng giá trị doanh số</th>
                            <th className="p-3 text-right">Lượt mua</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {revenueChartData.map(pt => (
                            <tr key={pt.period} className="hover:bg-slate-50/80 transition">
                              <td className="p-3 font-bold text-slate-900">{pt.label}</td>
                              <td className="p-3 font-bold text-emerald-700">{formatVND(pt.revenue)}</td>
                              <td className="p-3 text-slate-600">{formatVND(pt.grossSales)}</td>
                              <td className="p-3 text-right">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                                  {pt.orderCount} đơn
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* DETAILED COURSE REVENUE BREAKDOWN TABLE */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div>
                  <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Thống Kê Doanh Thu Chi Tiết Từng Khóa Học
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Số liệu doanh thu gộp, tỷ lệ khấu trừ phí sàn (30%) và doanh thu thực nhận (70%) phân bổ cho từng khóa học.
                  </p>
                </div>

                {courseBreakdown.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    Chưa có giao dịch phát sinh doanh thu cho các khóa học.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs min-w-[650px]">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Khóa học</th>
                          <th className="p-3">Giá bán gốc</th>
                          <th className="p-3 text-center">Lượt bán</th>
                          <th className="p-3">Doanh thu gộp</th>
                          <th className="p-3">Phí sàn (30%)</th>
                          <th className="p-3 text-right">Thực nhận (70%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {courseBreakdown.map(item => (
                          <tr key={item.courseId} className="hover:bg-slate-50/80 transition">
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{item.courseTitle}</p>
                              <p className="text-[10px] text-slate-400 font-mono">ID: {item.courseId}</p>
                            </td>
                            <td className="p-3 font-mono text-slate-600">{formatVND(item.basePrice)}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                                {item.salesCount} đơn
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-800">{formatVND(item.grossRevenue)}</td>
                            <td className="p-3 text-rose-600 font-medium">-{formatVND(item.platformFee)}</td>
                            <td className="p-3 text-right font-black text-emerald-700 text-sm">{formatVND(item.netRevenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                        <tr>
                          <td className="p-3" colSpan={2}>Tổng cộng:</td>
                          <td className="p-3 text-center">{courseBreakdown.reduce((sum, i) => sum + i.salesCount, 0)} đơn</td>
                          <td className="p-3">{formatVND(courseBreakdown.reduce((sum, i) => sum + i.grossRevenue, 0))}</td>
                          <td className="p-3 text-rose-600">-{formatVND(courseBreakdown.reduce((sum, i) => sum + i.platformFee, 0))}</td>
                          <td className="p-3 text-right text-emerald-700 text-sm font-black">{formatVND(courseBreakdown.reduce((sum, i) => sum + i.netRevenue, 0))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 4: MINIO VIDEO UPLOAD (REAL HLS PIPELINE) */}
      {activeTab === 'upload' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-3xl">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5" /> Pipeline Thật (MinIO + RabbitMQ + FFmpeg)
              </span>
              <h3 className="font-bold text-lg text-[#2c3e50] mt-1">Tải Video Lên Cụm MinIO Storage & Mã Hóa HLS</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cấp Presigned URL trực tiếp từ Media Service, đẩy lên MinIO S3 bucket, Worker FFmpeg tự động bẻ chunk HLS và mã hóa bảo mật AES-128.
              </p>
            </div>
          </div>

          {/* Banner thông báo bài học mục tiêu */}
          {selectedTargetLessonId ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs text-emerald-800 font-semibold">
                  Mục tiêu tải lên: <span className="font-bold underline">{selectedLessonTitle}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('curriculum')}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 underline font-medium cursor-pointer"
              >
                Đổi bài học khác
              </button>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Vui lòng chọn bài học ở mục bên dưới để hệ thống tự động gán video sau khi mã hóa xong.</span>
            </div>
          )}

          {/* Chọn bài học để gắn video */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Chọn bài học cần gắn video:
                </label>
                <select
                  value={selectedTargetLessonId}
                  onChange={(e) => {
                    const lId = e.target.value;
                    setSelectedTargetLessonId(lId);
                    for (const s of sections) {
                      const found = s.lessons?.find(l => l.id === lId);
                      if (found) {
                        setSelectedLessonTitle(found.title);
                        break;
                      }
                    }
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-[#2c3e50]"
                >
                  <option value="">-- Chưa gắn vào bài học nào (chỉ upload) --</option>
                  {sections.map(s => (
                    <optgroup key={s.id} label={`Chương: ${s.title}`}>
                      {s.lessons?.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.title} {l.videoUrl ? '(Đã có video)' : '(Chưa có video)'}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên bài giảng hiển thị:
                </label>
                <input
                  type="text"
                  value={selectedLessonTitle}
                  onChange={e => setSelectedLessonTitle(e.target.value)}
                  placeholder="Nhập hoặc đổi tên bài học..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#2c3e50]"
                />
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedVideoFile(file);
                  setUploadError(null);
                  setUploadStatus('IDLE');
                  setUploadProgress(0);
                }
              }}
              className="hidden"
            />

            {/* Dropzone container */}
            <div 
              onClick={() => {
                if (uploadStatus === 'IDLE' || uploadStatus === 'COMPLETED' || uploadStatus === 'ERROR') {
                  fileInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed p-6 sm:p-8 rounded-2xl text-center cursor-pointer transition-all space-y-3 ${
                selectedVideoFile 
                  ? 'border-emerald-500 bg-emerald-50/40' 
                  : 'border-slate-300 hover:border-[#e74c3c] bg-slate-50'
              }`}
            >
              <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center transition ${
                selectedVideoFile ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-[#2c3e50]'
              }`}>
                {selectedVideoFile ? <Film className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
              </div>
              <div>
                {selectedVideoFile ? (
                  <>
                    <p className="font-bold text-sm text-emerald-900 truncate max-w-md mx-auto">
                      {selectedVideoFile.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dung lượng: <span className="font-semibold text-slate-700">{formatFileSize(selectedVideoFile.size)}</span> • Bấm để chọn file khác
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-xs md:text-sm text-[#2c3e50]">
                      Bấm để chọn file video thật từ máy tính
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Hỗ trợ MP4, MOV, MKV, WebM • Tự động mã hóa AES-128 & phát HLS
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Action Button: Start Upload */}
            {uploadStatus === 'IDLE' || uploadStatus === 'ERROR' ? (
              <button
                type="button"
                onClick={handleRealUpload}
                disabled={!selectedVideoFile}
                className="w-full py-3 bg-[#e74c3c] hover:bg-[#c0392b] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Bắt Đầu Tải Lên MinIO & Chuyển Mã HLS</span>
              </button>
            ) : null}

            {/* Progress & Status Tracker */}
            {uploadStatus !== 'IDLE' && (
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    {uploadStatus === 'GETTING_PRESIGNED' && (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>1/3 Đang xin Presigned URL từ media-service...</span>
                      </>
                    )}
                    {uploadStatus === 'UPLOADING' && (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>2/3 Đang tải lên MinIO ({uploadProgress}%)...</span>
                      </>
                    )}
                    {uploadStatus === 'FFMPEG_PROCESSING' && (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        <span>3/3 Worker FFmpeg đang bẻ chunk HLS và mã hóa AES-128...</span>
                      </>
                    )}
                    {uploadStatus === 'COMPLETED' && (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Video đã mã hóa HLS thành công & sẵn sàng phát!</span>
                      </>
                    )}
                    {uploadStatus === 'ERROR' && (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-rose-400">Quá trình tải lên hoặc xử lý gặp lỗi.</span>
                      </>
                    )}
                  </span>
                  <span className="text-emerald-400 font-bold">{uploadProgress}%</span>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      uploadStatus === 'COMPLETED' ? 'bg-emerald-500' : uploadStatus === 'ERROR' ? 'bg-rose-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                {uploadStatus === 'COMPLETED' && lastUploadedMediaId && (
                  <div className="pt-3 border-t border-slate-800 space-y-3 font-sans">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-slate-400 text-[11px]">Media ID tạo bởi hệ thống:</p>
                        <code className="text-emerald-400 text-xs font-mono font-bold">{lastUploadedMediaId}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Xem thử Video HLS</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadStatus('IDLE');
                            setSelectedVideoFile(null);
                            setUploadProgress(0);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                        >
                          <span>Tải video khác</span>
                        </button>
                      </div>
                    </div>

                    {/* Cho phép gán vào bài học nếu lúc upload chưa chọn */}
                    {!selectedTargetLessonId && (
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                        <p className="text-xs text-slate-300 font-semibold">Gán video này vào một bài học trong khóa:</p>
                        <div className="flex items-center gap-2">
                          <select
                            value={assigningLessonId}
                            onChange={e => setAssigningLessonId(e.target.value)}
                            className="p-1.5 border border-slate-700 rounded-lg text-xs bg-slate-900 text-slate-200 focus:outline-none flex-1"
                          >
                            <option value="">-- Chọn bài học để gán --</option>
                            {sections.map(s => (
                              <optgroup key={s.id} label={`Chương: ${s.title}`}>
                                {s.lessons?.map(l => (
                                  <option key={l.id} value={l.id}>
                                    {l.title} {l.videoUrl ? '(Đã có video)' : '(Chưa có video)'}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={!assigningLessonId || isAssigning}
                            onClick={() => handleAssignVideoToLesson(assigningLessonId, lastUploadedMediaId)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            {isAssigning ? 'Đang gán...' : 'Gán vào bài'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: WALLET & PAYOUTS (REAL DATA CONNECTED TO FINANCE SERVICE) */}
      {activeTab === 'payouts' && (
        !financialSessionActive ? (
          <div className="bg-white p-12 rounded-2xl border border-amber-200 text-center max-w-lg mx-auto space-y-4 shadow-xs animate-in fade-in">
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
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-900 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Phiên bảo mật ví đang hoạt động (Thời gian còn: <strong className="font-mono text-amber-950 font-bold">{formatCountdown(financialRemaining)}</strong>)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSecuritySettingsOpen(true)}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-800 hover:bg-amber-100 rounded-lg transition font-semibold cursor-pointer text-[11px]"
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
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-700">
                {formatVND(walletBalance?.availableBalance ?? 0)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Có thể tạo lệnh rút tiền ngay</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Đang chờ rút</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-700">
                {formatVND(walletBalance?.blockedBalance ?? 0)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Đang tạm khóa trong lệnh rút</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Chờ giải phóng</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-blue-700">
                {formatVND(walletBalance?.pendingBalance ?? 0)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Tự động giải phóng sau 3 ngày</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Tổng số dư ví</span>
                <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800">
                {formatVND(walletBalance?.actualBalance ?? 0)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Thực tế trong tài khoản</p>
            </div>
          </div>

          <div role="status" className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs leading-relaxed text-indigo-950 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-indigo-900">Quy định rút tiền doanh thu giảng viên:</p>
              <p className="text-indigo-800 text-[11px] mt-0.5">
                Mỗi lệnh rút tối thiểu 500.000 VNĐ. Số tiền sẽ được tạm khóa từ số dư khả dụng và giải ngân về số tài khoản ngân hàng chính của giảng viên sau khi Quản trị viên duyệt lệnh.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form tạo yêu cầu rút */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Tạo Yêu Cầu Rút Tiền
                </h3>
              </div>

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
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
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
                  <p className="text-[11px] text-slate-500">
                    Hệ thống tự động sử dụng tài khoản ngân hàng chính đã đăng ký trong hồ sơ giảng viên của bạn.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={payoutSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {payoutSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang gửi yêu cầu...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Gửi Lệnh Rút Tiền
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
                  onClick={() => void loadPayoutData()}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                >
                  Làm mới
                </button>
              </div>

              {payoutLoading ? (
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

      {/* TAB PROMOTIONS: QUẢN LÝ MÃ GIẢM GIÁ */}
      {activeTab === 'promotions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#e74c3c]" />
                <h3 className="text-base font-bold text-slate-800">Quản lý Mã Giảm Giá & Voucher</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tạo mã khuyến mãi độc quyền để thu hút học viên đăng ký khóa học của bạn.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadPromotions()}
                disabled={promotionsLoading}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${promotionsLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingPromo(!isCreatingPromo)}
                className="px-4 py-2 rounded-xl bg-[#e74c3c] hover:bg-[#c0392b] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {isCreatingPromo ? 'Đóng biểu mẫu' : 'Tạo mã voucher mới'}
              </button>
            </div>
          </div>

          {promotionsError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{promotionsError}</span>
            </div>
          )}

          {/* Form Tạo Mã Mới */}
          {isCreatingPromo && (
            <form onSubmit={handleCreatePromo} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông tin mã giảm giá mới</span>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Sẽ tự động áp dụng cho: {currentCourse.title}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã code voucher <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: BANMOI30, TECH50"
                    value={promoFormCode}
                    onChange={e => setPromoFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#e74c3c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hình thức giảm giá
                  </label>
                  <select
                    value={promoDiscountType}
                    onChange={e => setPromoDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#e74c3c]"
                  >
                    <option value="PERCENT">Giảm theo % (Phần trăm)</option>
                    <option value="AMOUNT">Giảm số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {promoDiscountType === 'PERCENT' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={promoDiscountType === 'PERCENT' ? 1 : 1000}
                    max={promoDiscountType === 'PERCENT' ? 100 : undefined}
                    step={promoDiscountType === 'PERCENT' ? 1 : 10000}
                    value={promoDiscountValue}
                    onChange={e => setPromoDiscountValue(e.target.value)}
                    placeholder={promoDiscountType === 'PERCENT' ? '20' : '100000'}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#e74c3c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giới hạn số lượt dùng (để trống = vô hạn)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={promoUsageLimit}
                    onChange={e => setPromoUsageLimit(e.target.value)}
                    placeholder="Không giới hạn"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#e74c3c]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày hết hạn (tùy chọn)
                  </label>
                  <input
                    type="date"
                    value={promoEndDate}
                    onChange={e => setPromoEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#e74c3c]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreatingPromo(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={promoSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {promoSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {promoSubmitting ? 'Đang tạo...' : 'Lưu & Áp dụng ngay'}
                </button>
              </div>
            </form>
          )}

          {/* Danh Sách Mã Giảm Giá */}
          {promotionsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#e74c3c]" />
              <p className="text-xs">Đang tải danh sách voucher...</p>
            </div>
          ) : promotionsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2 border-2 border-dashed border-slate-200 rounded-2xl">
              <Tag className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">Bạn chưa tạo mã giảm giá nào.</p>
              <p className="text-[11px] text-slate-400">Bấm "Tạo mã voucher mới" ở góc phải để bắt đầu chiến dịch khuyến mãi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-3.5">Mã Voucher</th>
                    <th className="p-3.5">Mức giảm</th>
                    <th className="p-3.5">Lượt sử dụng</th>
                    <th className="p-3.5">Hạn dùng</th>
                    <th className="p-3.5">Áp dụng cho khóa này</th>
                    <th className="p-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {promotionsList.map(promo => {
                    const isAttached = (promo.appliedCourseIds || []).includes(currentCourse.id);
                    const isLoading = promoActionLoadingId === promo.id;

                    return (
                      <tr key={promo.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-mono font-bold text-slate-900 flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                            {promo.code}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-emerald-600">
                          {promo.discountPercent ? `Giảm ${promo.discountPercent}%` : formatVND(promo.discountAmount || 0)}
                        </td>
                        <td className="p-3.5 text-slate-700">
                          <span className="font-bold">{promo.usageCount ?? 0}</span>
                          <span className="text-slate-400"> / {promo.usageLimit ? promo.usageLimit : '∞'}</span>
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {promo.endDate ? new Date(promo.endDate).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}
                        </td>
                        <td className="p-3.5">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => void handleToggleCourseAttach(promo)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
                              isAttached
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {isLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isAttached ? (
                              <Link2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Unlink className="w-3 h-3 text-slate-400" />
                            )}
                            {isAttached ? 'Đang kích hoạt' : 'Chưa gắn (Bấm để bật)'}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => void handleDeletePromo(promo.id, promo.code)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                            title="Xóa mã giảm giá"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Security Modals */}
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

      {/* Lesson Attachments Modal (Hạng mục E) */}
      <LessonAttachmentsModal
        isOpen={!!attachmentModalLesson}
        onClose={() => setAttachmentModalLesson(null)}
        lessonId={attachmentModalLesson?.id || ''}
        lessonTitle={attachmentModalLesson?.title || ''}
      />

      {/* Video HLS Preview Modal */}
      <VideoHlsPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        mediaId={lastUploadedMediaId || ''}
        lessonTitle={selectedLessonTitle}
      />
    </div>
  );
};
